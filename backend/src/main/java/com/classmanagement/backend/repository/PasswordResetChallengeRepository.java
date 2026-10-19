package com.classmanagement.backend.repository;

import com.classmanagement.backend.entity.PasswordResetChallenge;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PasswordResetChallengeRepository extends JpaRepository<PasswordResetChallenge, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from PasswordResetChallenge c where c.userId = :userId")
    Optional<PasswordResetChallenge> findByUserIdForUpdate(@Param("userId") Long userId);

    Optional<PasswordResetChallenge> findByUserId(Long userId);
}
