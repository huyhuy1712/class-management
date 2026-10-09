package com.classmanagement.backend.dto.exam;

import com.classmanagement.backend.entity.enums.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record UpdateExamRequest(
        @NotNull @Valid CreateCompleteExamRequest.BasicInfo basicInfo,
        @NotNull @Valid Assignment assignment) {
    public record Assignment(
            @NotNull @Positive Long id,
            @NotNull ExamAssignmentType assignmentType,
            @NotNull @Size(max = 500) List<@NotNull @Positive Long> classIds,
            @NotNull @Size(max = 2000) List<@NotNull @Positive Long> studentIds,
            @NotNull ScoreVisibility scoreVisibility,
            @NotNull AnswerVisibility answerVisibility,
            @DecimalMin("0") @Digits(integer = 4, fraction = 2) BigDecimal threshold,
            @NotNull Boolean hideCorrectAnswerOnWrong,
            LocalDateTime openTime, LocalDateTime closeTime) {
        public CreateCompleteExamRequest.Assignment toCreateAssignment() {
            return new CreateCompleteExamRequest.Assignment(assignmentType, classIds, studentIds,
                    scoreVisibility, answerVisibility, threshold, hideCorrectAnswerOnWrong, openTime, closeTime);
        }
    }
}
