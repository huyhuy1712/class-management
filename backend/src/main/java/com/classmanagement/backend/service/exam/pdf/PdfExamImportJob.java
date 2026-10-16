package com.classmanagement.backend.service.exam.pdf;

import com.classmanagement.backend.repository.exam.PdfExamImportRepository;
import jakarta.annotation.PreDestroy;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicBoolean;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** One CPU job per BE process; never block the scheduler used by attempt expiry. */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.exam-import.enabled", havingValue = "true", matchIfMissing = true)
public class PdfExamImportJob {
    private final PdfExamImportRepository jobs;
    private final PdfExamImportService imports;
    private final ExecutorService executor = Executors.newSingleThreadExecutor(
            Thread.ofPlatform().name("pdf-exam-import").daemon(true).factory());
    private final AtomicBoolean busy = new AtomicBoolean();
    private volatile Future<?> running;
    private volatile Instant startedAt;

    @Scheduled(fixedDelayString = "${app.exam-import.poll-delay-ms:3000}")
    public void tick() {
        if (!busy.compareAndSet(false, true)) {
            var current = running;
            var start = startedAt;
            if (current != null && start != null
                    && Duration.between(start, Instant.now()).compareTo(Duration.ofMinutes(25)) > 0) {
                current.cancel(true);
            }
            return;
        }
        try {
            var next = jobs.claim(PdfExamImportService.now());
            if (next.isEmpty()) {
                busy.set(false);
                return;
            }
            startedAt = Instant.now();
            running = executor.submit(() -> {
                try {
                    imports.process(next.get());
                } catch (RuntimeException error) {
                    log.warn("PDF import worker stopped; lease recovery will retry job {}", next.get().id());
                } finally {
                    busy.set(false);
                }
            });
        } catch (RuntimeException error) {
            busy.set(false);
            log.warn("Cannot claim PDF import job; next scheduler tick will retry");
        }
    }

    @Scheduled(fixedDelayString = "${app.exam-import.cleanup-delay-ms:60000}")
    public void cleanup() {
        try {
            imports.cleanup();
        } catch (Exception error) {
            log.warn("PDF import cleanup deferred to next run");
        }
    }

    @PreDestroy
    public void stop() {
        executor.shutdownNow();
    }
}
