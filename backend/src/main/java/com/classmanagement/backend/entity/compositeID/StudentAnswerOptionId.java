package com.classmanagement.backend.entity.compositeID;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StudentAnswerOptionId implements Serializable {

    @Column(name = "answer_value_id")
    private Long answerValueId;

    @Column(name = "option_id")
    private Long optionId;

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (!(o instanceof StudentAnswerOptionId that)) {
            return false;
        }

        return Objects.equals(answerValueId, that.answerValueId)
                && Objects.equals(optionId, that.optionId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(answerValueId, optionId);
    }
}