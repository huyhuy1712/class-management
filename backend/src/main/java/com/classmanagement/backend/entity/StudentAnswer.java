package com.classmanagement.backend.entity;

import com.classmanagement.backend.entity.enums.GradingStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_answers", uniqueConstraints = {
        @UniqueConstraint(name = "uq_student_answers_attempt_question", columnNames = { "attempt_id", "question_id" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attempt_id", nullable = false)
    private ExamAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "auto_score", precision = 6, scale = 2)
    private BigDecimal autoScore;

    @Column(name = "manual_score", precision = 6, scale = 2)
    private BigDecimal manualScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "grading_status", nullable = false, length = 20)
    private GradingStatus gradingStatus;

    @Column(name = "teacher_comment", columnDefinition = "TEXT")
    private String teacherComment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "graded_by")
    private User gradedBy;

    @Column(name = "graded_at")
    private LocalDateTime gradedAt;

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

        if (gradingStatus == null) {
            gradingStatus = GradingStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Transient
    public BigDecimal getFinalScore() {
        if (manualScore != null) {
            return manualScore;
        }

        return autoScore;
    }
}