package com.classmanagement.backend.entity;

import com.classmanagement.backend.entity.enums.ExamAttemptStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "exam_attempts",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_exam_attempts",
            columnNames = {
                "class_exam_id",
                "student_id",
                "attempt_number"
            }
        )
    },
    indexes = {
        @Index(
            name = "idx_exam_attempts_student",
            columnList = "student_id"
        )
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_exam_id", nullable = false)
    private ClassExam classExam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "attempt_number", nullable = false)
    private Integer attemptNumber;

    @Column(
        name = "started_at",
        nullable = false,
        updatable = false
    )
    private LocalDateTime startedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(
        name = "mc_score",
        precision = 10,
        scale = 2
    )
    private BigDecimal mcScore;

    @Column(
        name = "short_score",
        precision = 10,
        scale = 2
    )
    private BigDecimal shortScore;

    @Column(
        name = "tf_score",
        precision = 10,
        scale = 2
    )
    private BigDecimal tfScore;

    @Column(
        name = "essay_score",
        precision = 10,
        scale = 2
    )
    private BigDecimal essayScore;

    @Column(
        name = "total_score",
        precision = 10,
        scale = 2
    )
    private BigDecimal totalScore;

    @Enumerated(EnumType.STRING)
    @Column(
        name = "status",
        nullable = false,
        length = 30
    )
    private ExamAttemptStatus status;

    @Column(name = "teacher_comment", columnDefinition = "TEXT")
    private String teacherComment;

    @PrePersist
    protected void onCreate() {
        if (startedAt == null) {
            startedAt = LocalDateTime.now();
        }

        if (status == null) {
            status = ExamAttemptStatus.IN_PROGRESS;
        }
    }
}