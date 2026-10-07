package com.classmanagement.backend.entity;

import com.classmanagement.backend.entity.enums.ExamAssignmentStatus;
import com.classmanagement.backend.entity.enums.ExamAssignmentType;
import com.classmanagement.backend.entity.enums.AnswerVisibility;
import com.classmanagement.backend.entity.enums.ScoreVisibility;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "exam_assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Enumerated(EnumType.STRING)
    @Column(name = "assignment_type", nullable = false, length = 20)
    private ExamAssignmentType assignmentType;

    @Column(name = "open_time")
    private LocalDateTime openTime;

    @Column(name = "close_time")
    private LocalDateTime closeTime;

    @Column(name = "time_limit")
    private Integer timeLimit;

    @Column(name = "max_attempts")
    private Integer maxAttempts;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ExamAssignmentStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "score_visibility", nullable = false, length = 30)
    private ScoreVisibility scoreVisibility;

    @Enumerated(EnumType.STRING)
    @Column(name = "answer_visibility", nullable = false, length = 30)
    private AnswerVisibility answerVisibility;

    @Column(name = "answer_visibility_score", precision = 6, scale = 2)
    private BigDecimal answerVisibilityScore;

    @Column(name = "hide_correct_answer_on_wrong", nullable = false)
    private Boolean hideCorrectAnswerOnWrong;

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

        if (status == null) {
            status = ExamAssignmentStatus.DRAFT;
        }

        if (scoreVisibility == null) {
            scoreVisibility = ScoreVisibility.NEVER;
        }

        if (answerVisibility == null) {
            answerVisibility = AnswerVisibility.NEVER;
        }

        if (hideCorrectAnswerOnWrong == null) {
            hideCorrectAnswerOnWrong = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}