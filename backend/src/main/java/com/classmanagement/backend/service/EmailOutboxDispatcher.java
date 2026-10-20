package com.classmanagement.backend.service;

import com.classmanagement.backend.entity.EmailOutboxMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class EmailOutboxDispatcher {
    private static final int BATCH_SIZE = 10;

    private final EmailOutboxService outboxService;
    private final JavaMailSender mailSender;

    @Value("${app.mail.from:}")
    private String mailFrom;

    @Scheduled(fixedDelayString = "${app.mail.outbox.poll-delay-ms:3000}")
    public void dispatchPendingEmails() {
        for (int i = 0; i < BATCH_SIZE; i++) {
            var claimed = outboxService.claimNext();
            if (claimed.isEmpty()) return;

            EmailOutboxMessage email = claimed.get();
            try {
                send(email);
            } catch (RuntimeException failure) {
                outboxService.markFailed(email.getId(), failure);
                log.warn("Email delivery failed for outbox id {}; retry scheduled or message marked failed",
                        email.getId(), failure);
                continue;
            }
            outboxService.markSent(email.getId());
        }
    }

    private void send(EmailOutboxMessage email) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(email.getRecipient());
        message.setSubject(email.getSubject());
        message.setText(email.getBody());
        mailSender.send(message);
    }
}
