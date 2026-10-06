package com.classmanagement.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "attempt_section_scores", uniqueConstraints = {
        @UniqueConstraint(name = "uq_attempt_section_scores_attempt_section", columnNames = { "attempt_id",
                "section_id" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttemptSectionScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attempt_id", nullable = false)
    private ExamAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "section_id", nullable = false)
    private ExamSection section;

    @Column(name = "auto_score", nullable = false, precision = 6, scale = 2)
    private BigDecimal autoScore;

    @Column(name = "manual_score", nullable = false, precision = 6, scale = 2)
    private BigDecimal manualScore;

    @Column(name = "total_score", nullable = false, precision = 6, scale = 2)
    private BigDecimal totalScore;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;

        if (autoScore == null) {
            autoScore = BigDecimal.ZERO;
        }

        if (manualScore == null) {
            manualScore = BigDecimal.ZERO;
        }

        if (totalScore == null) {
            totalScore = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}