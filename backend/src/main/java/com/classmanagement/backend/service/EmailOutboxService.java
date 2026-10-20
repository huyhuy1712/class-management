package com.classmanagement.backend.service;

import com.classmanagement.backend.entity.EmailOutboxMessage;
import com.classmanagement.backend.repository.EmailOutboxRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EmailOutboxService {
    private static final int MAX_ATTEMPTS = 8;
    private static final int MAX_ERROR_LENGTH = 1000;

    private final EmailOutboxRepository repository;

    @Transactional
    public Optional<EmailOutboxMessage> claimNext() {
        return repository.findNextReadyForUpdate().map(message -> {
            message.setStatus("PROCESSING");
            message.setLockedUntil(LocalDateTime.now().plusMinutes(2));
            return repository.save(message);
        });
    }

    @Transactional
    public void markSent(Long id) {
        EmailOutboxMessage message = repository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy email trong hàng đợi."));
        message.setStatus("SENT");
        message.setSentAt(LocalDateTime.now());
        message.setLockedUntil(null);
        message.setLastError(null);
        message.setBody("");
        repository.save(message);
    }

    @Transactional
    public void markFailed(Long id, RuntimeException failure) {
        EmailOutboxMessage message = repository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy email trong hàng đợi."));
        int attemptCount = message.getAttemptCount() + 1;
        message.setAttemptCount(attemptCount);
        message.setLockedUntil(null);
        message.setLastError(truncate(failure.getMessage()));

        if (attemptCount >= MAX_ATTEMPTS) {
            message.setStatus("FAILED");
            message.setBody("");
        } else {
            message.setStatus("PENDING");
            long delaySeconds = Math.min(3600, 5L << (attemptCount - 1));
            message.setNextAttemptAt(LocalDateTime.now().plus(Duration.ofSeconds(delaySeconds)));
        }
        repository.save(message);
    }

    private String truncate(String message) {
        if (message == null || message.isBlank()) return "Lỗi gửi email không có chi tiết.";
        return message.length() <= MAX_ERROR_LENGTH
                ? message
                : message.substring(0, MAX_ERROR_LENGTH);
    }
}
