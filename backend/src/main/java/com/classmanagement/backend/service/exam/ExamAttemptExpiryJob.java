package com.classmanagement.backend.service.exam;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ExamAttemptExpiryJob {
    private final ExamAttemptService attempts;
    @Scheduled(fixedDelayString="${exam.attempt.expiry-delay-ms:15000}")
    public void expire() {
        try { attempts.expireBatch(); }
        catch(RuntimeException error) { log.error("Cannot finalize expired exam attempt batch",error); }
    }
}
