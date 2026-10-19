package com.classmanagement.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "password_reset_challenges", uniqueConstraints = {
        @UniqueConstraint(name = "uk_password_reset_challenges_user_id", columnNames = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetChallenge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "verification_code_hash", length = 100)
    private String verificationCodeHash;

    @Column(name = "verification_expires_at")
    private LocalDateTime verificationExpiresAt;

    @Column(name = "verification_sent_at")
    private LocalDateTime verificationSentAt;

    @Column(name = "verification_attempts", nullable = false)
    private int verificationAttempts;

    @Column(name = "reset_token_hash", length = 100)
    private String resetTokenHash;

    @Column(name = "reset_token_expires_at")
    private LocalDateTime resetTokenExpiresAt;
}
