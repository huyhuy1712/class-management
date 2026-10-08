package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.repository.exam.ExamMediaRepository;
import com.classmanagement.backend.service.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class ExamMediaCleanup {
    private final ExamMediaRepository mediaRepository;
    private final ExamMediaLifecycle lifecycle;
    private final StorageService storageService;

    @Scheduled(fixedDelayString = "${app.exam-media.cleanup-delay-ms:60000}")
    public void cleanup() {
        // Bounded work: no full-table load and no storage calls in DB transactions.
        for (var id : mediaRepository.findCleanupCandidates(LocalDateTime.now(), PageRequest.of(0, 10))) {
            try {
                String path = lifecycle.leaseCleanup(id);
                if (path == null) continue;
                storageService.delete(path);
                lifecycle.cleanupSucceeded(id);
            } catch (RuntimeException ex) {
                log.warn("Exam media cleanup failed for {}; retry remains persistent", id);
                try {
                    lifecycle.cleanupFailed(id);
                } catch (RuntimeException retryError) {
                    log.warn("Cannot update cleanup retry for {}", id);
                }
            }
        }
    }
}
