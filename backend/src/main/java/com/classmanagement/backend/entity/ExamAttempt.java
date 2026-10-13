package com.classmanagement.backend.entity;

import com.classmanagement.backend.entity.enums.ExamAttemptStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "exam_attempts", uniqueConstraints = {
        @UniqueConstraint(name = "uq_exam_attempts_assignment_student", columnNames = { "assignment_id", "student_id" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamAttempt {
    @Version @Builder.Default @Column(nullable=false)
    private Long revision = 0L;
    @Column(name="start_request_id")
    private java.util.UUID startRequestId;
    @Column(name="deadline_at")
    private LocalDateTime deadlineAt;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assignment_id", nullable = false)
    private ExamAssignment assignment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "attempt_count", nullable = false)
    private Integer attemptCount;

    @Column(name = "tab_switch_count", nullable = false)
    private Integer tabSwitchCount;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "auto_score", nullable = false, precision = 6, scale = 2)
    private BigDecimal autoScore;

    @Column(name = "manual_score", nullable = false, precision = 6, scale = 2)
    private BigDecimal manualScore;

    @Column(name = "total_score", nullable = false, precision = 6, scale = 2)
    private BigDecimal totalScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ExamAttemptStatus status;

    @Column(name = "teacher_comment", columnDefinition = "TEXT")
    private String teacherComment;

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

        if (attemptCount == null) {
            attemptCount = 0;
        }

        if (tabSwitchCount == null) {
            tabSwitchCount = 0;
        }

        if (autoScore == null) {
            autoScore = BigDecimal.ZERO;
        }

        if (manualScore == null) {
            manualScore = BigDecimal.ZERO;
        }

        if (totalScore == null) {
            totalScore = BigDecimal.ZERO;
        }

        if (status == null) {
            status = ExamAttemptStatus.NOT_STARTED;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
