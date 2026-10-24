package com.classmanagement.backend.service.exam.pdf;

import static org.junit.jupiter.api.Assertions.*;

import com.classmanagement.backend.repository.exam.PdfExamImportRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

class PdfExamImportJobTest {
    @Test
    void runsOutsideSchedulerAndDoesNotClaimAnotherJobWhileBusy() throws Exception {
        var entered = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        var stopped = new CountDownLatch(1);
        var claims = new AtomicInteger();
        var now = PdfExamImportService.now();
        var queued = new PdfExamImportRepository.Job(
                UUID.randomUUID(), 1, UUID.randomUUID(), "hash", 10, 1,
                "PROCESSING", "INDEXING", UUID.randomUUID(), null, null, null,
                UUID.randomUUID(), now, now, now.plusHours(24));
        var repository = new PdfExamImportRepository(null) {
            @Override
            public Optional<Job> claim(LocalDateTime time) {
                claims.incrementAndGet();
                return Optional.of(queued);
            }
        };
        var service = new PdfExamImportService(repository, null, null, null, null) {
            @Override
            public void process(PdfExamImportRepository.Job job) {
                entered.countDown();
                try {
                    release.await();
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                } finally {
                    stopped.countDown();
                }
            }
        };
        var scheduler = new PdfExamImportJob(repository, service);
        try {
            scheduler.tick();
            assertTrue(entered.await(3, TimeUnit.SECONDS));
            scheduler.tick();
            scheduler.tick();
            assertEquals(1, claims.get());
        } finally {
            scheduler.stop();
            release.countDown();
        }
        assertTrue(stopped.await(3, TimeUnit.SECONDS));
    }
}
