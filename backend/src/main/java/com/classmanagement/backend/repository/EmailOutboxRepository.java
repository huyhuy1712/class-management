package com.classmanagement.backend.repository;

import com.classmanagement.backend.entity.EmailOutboxMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface EmailOutboxRepository extends JpaRepository<EmailOutboxMessage, Long> {
    @Query(value = """
            SELECT *
            FROM email_outbox
            WHERE (status = 'PENDING' AND next_attempt_at <= CURRENT_TIMESTAMP)
               OR (status = 'PROCESSING' AND locked_until <= CURRENT_TIMESTAMP)
            ORDER BY created_at ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED
            """, nativeQuery = true)
    Optional<EmailOutboxMessage> findNextReadyForUpdate();
}
