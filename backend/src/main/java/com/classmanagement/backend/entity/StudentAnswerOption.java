package com.classmanagement.backend.entity;

import com.classmanagement.backend.entity.compositeID.StudentAnswerOptionId;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "student_answer_options")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentAnswerOption {

    @EmbeddedId
    private StudentAnswerOptionId id;

    @MapsId("answerValueId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "answer_value_id", nullable = false)
    private StudentAnswerValue answerValue;

    @MapsId("optionId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "option_id", nullable = false)
    private AnswerOption option;

    // TRUE_FALSE: the student's explicit response; choice selections use null.
    @Column(name = "boolean_value")
    private Boolean booleanValue;
}
