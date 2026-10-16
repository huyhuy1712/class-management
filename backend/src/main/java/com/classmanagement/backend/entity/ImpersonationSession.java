package com.classmanagement.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "impersonation_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImpersonationSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "admin_user_id", nullable = false)
    private Long adminUserId;

    @Column(name = "target_user_id", nullable = false)
    private Long targetUserId;

    @Column(length = 500)
    private String reason;

    @Column(name = "started_at", nullable = false, updatable = false)
    private Instant startedAt;

    @Column(name = "expires_at", nullable = false, updatable = false)
    private Instant expiresAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "end_reason", length = 30)
    private String endReason;

    @PrePersist
    protected void onCreate() {
        if (startedAt == null) {
            startedAt = Instant.now();
        }
    }
}
