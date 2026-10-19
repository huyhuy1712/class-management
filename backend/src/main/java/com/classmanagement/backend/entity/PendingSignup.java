package com.classmanagement.backend.entity;

import com.classmanagement.backend.entity.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "pending_signups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingSignup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(unique = true, length = 20)
    private String phone;

    @Column(length = 500)
    private String avatar;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    @Column(name = "verification_code_hash", length = 100)
    private String verificationCodeHash;

    @Column(name = "verification_expires_at")
    private LocalDateTime verificationExpiresAt;

    @Column(name = "verification_sent_at")
    private LocalDateTime verificationSentAt;

    @Column(name = "verification_attempts", nullable = false)
    private int verificationAttempts;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
