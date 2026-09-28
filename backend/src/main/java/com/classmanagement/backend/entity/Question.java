package com.classmanagement.backend.entity;

import com.classmanagement.backend.entity.enums.QuestionType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(
    name = "questions",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_questions_exam_order",
            columnNames = {"exam_id", "order_index"}
        )
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Enumerated(EnumType.STRING)
    @Column(
        name = "question_type",
        nullable = false,
        length = 20
    )
    private QuestionType questionType;

    @Column(name = "image", length = 500)
    private String image;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    @Column(
        name = "points",
        nullable = false,
        precision = 10,
        scale = 2
    )
    private BigDecimal points;

    @Column(name = "correct_answer_text", columnDefinition = "TEXT")
    private String correctAnswerText;
}