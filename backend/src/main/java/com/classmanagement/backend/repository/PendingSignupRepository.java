package com.classmanagement.backend.repository;

import com.classmanagement.backend.entity.PendingSignup;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PendingSignupRepository extends JpaRepository<PendingSignup, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PendingSignup p where p.email = :email")
    Optional<PendingSignup> findByEmailForUpdate(@Param("email") String email);

    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    boolean existsByUsernameAndIdNot(String username, Long id);
    boolean existsByEmailAndIdNot(String email, Long id);
    boolean existsByPhoneAndIdNot(String phone, Long id);
}
