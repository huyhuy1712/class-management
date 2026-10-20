package com.classmanagement.backend.service;

import com.classmanagement.backend.entity.EmailOutboxMessage;
import com.classmanagement.backend.repository.EmailOutboxRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

class EmailOutboxServiceTest {
    @Test
    void claimMarksMessageAsProcessingAndSetsLease() {
        EmailOutboxMessage message = newMessage(0);
        EmailOutboxService service = new EmailOutboxService(repository(message));

        EmailOutboxMessage claimed = service.claimNext().orElseThrow();

        assertEquals("PROCESSING", claimed.getStatus());
        assertNotNull(claimed.getLockedUntil());
        assertTrue(claimed.getLockedUntil().isAfter(LocalDateTime.now()));
    }

    @Test
    void failedDeliveryIsScheduledForRetry() {
        EmailOutboxMessage message = newMessage(0);
        message.setStatus("PROCESSING");
        message.setLockedUntil(LocalDateTime.now().plusMinutes(2));
        EmailOutboxService service = new EmailOutboxService(repository(message));

        service.markFailed(message.getId(), new IllegalStateException("SMTP unavailable"));

        assertEquals("PENDING", message.getStatus());
        assertEquals(1, message.getAttemptCount());
        assertNull(message.getLockedUntil());
        assertEquals("SMTP unavailable", message.getLastError());
        assertTrue(message.getNextAttemptAt().isAfter(LocalDateTime.now()));
    }

    @Test
    void successfulDeliveryClearsOneTimeCodeFromOutbox() {
        EmailOutboxMessage message = newMessage(0);
        message.setStatus("PROCESSING");
        EmailOutboxService service = new EmailOutboxService(repository(message));

        service.markSent(message.getId());

        assertEquals("SENT", message.getStatus());
        assertNotNull(message.getSentAt());
        assertNull(message.getLockedUntil());
        assertEquals("", message.getBody());
    }

    @Test
    void messageIsMarkedFailedAfterMaximumAttempts() {
        EmailOutboxMessage message = newMessage(7);
        message.setStatus("PROCESSING");
        EmailOutboxService service = new EmailOutboxService(repository(message));

        service.markFailed(message.getId(), new IllegalStateException("SMTP rejected credentials"));

        assertEquals("FAILED", message.getStatus());
        assertEquals(8, message.getAttemptCount());
        assertNull(message.getLockedUntil());
    }

    private static EmailOutboxMessage newMessage(int attempts) {
        return EmailOutboxMessage.builder()
                .id(12L)
                .recipient("student@example.com")
                .subject("Verification code")
                .body("Your code is 123456")
                .status("PENDING")
                .attemptCount(attempts)
                .nextAttemptAt(LocalDateTime.now())
                .build();
    }

    private static EmailOutboxRepository repository(EmailOutboxMessage message) {
        AtomicReference<EmailOutboxMessage> stored = new AtomicReference<>(message);
        return (EmailOutboxRepository) Proxy.newProxyInstance(
                EmailOutboxRepository.class.getClassLoader(),
                new Class<?>[]{EmailOutboxRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findNextReadyForUpdate" -> Optional.ofNullable(stored.get());
                    case "findById" -> Optional.ofNullable(stored.get());
                    case "save" -> {
                        stored.set((EmailOutboxMessage) args[0]);
                        yield args[0];
                    }
                    default -> throw new UnsupportedOperationException(method.getName());
                });
    }
}
