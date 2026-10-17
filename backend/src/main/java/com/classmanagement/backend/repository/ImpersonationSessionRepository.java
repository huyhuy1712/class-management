package com.classmanagement.backend.repository;

import com.classmanagement.backend.entity.ImpersonationSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface ImpersonationSessionRepository extends JpaRepository<ImpersonationSession, Long> {

    Optional<ImpersonationSession> findByIdAndEndedAtIsNullAndExpiresAtAfter(
            Long id,
            Instant now);

    boolean existsByTargetUserIdAndStartedAtAfter(Long targetUserId, Instant startedAt);

    boolean existsByTargetUserIdAndEndedAtIsNullAndExpiresAtAfter(Long targetUserId, Instant now);
}
