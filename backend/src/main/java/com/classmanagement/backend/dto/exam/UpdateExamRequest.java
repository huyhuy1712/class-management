package com.classmanagement.backend.dto.exam;

import com.classmanagement.backend.entity.enums.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record UpdateExamRequest(
        @NotNull @Valid CreateCompleteExamRequest.BasicInfo basicInfo,
        @NotNull @Valid Assignment assignment, @Min(0) Long revision) {
    public record Assignment(
            @NotNull @Positive Long id,
            @NotNull ExamAssignmentType assignmentType,
            @NotNull @Size(max = 500) List<@NotNull @Positive Long> classIds,
            @NotNull @Size(max = 2000) List<@NotNull @Positive Long> studentIds,
            @NotNull ScoreVisibility scoreVisibility,
            @NotNull AnswerVisibility answerVisibility,
            @DecimalMin("0") @Digits(integer = 4, fraction = 3, message = "Điểm tối đa 9999.999 và 3 chữ số thập phân.") BigDecimal threshold,
            @NotNull Boolean hideCorrectAnswerOnWrong,
            LocalDateTime openTime, LocalDateTime closeTime, @Positive Long classId) {
        public Assignment(Long id, ExamAssignmentType assignmentType, List<Long> classIds, List<Long> studentIds,
                ScoreVisibility scoreVisibility, AnswerVisibility answerVisibility, BigDecimal threshold,
                Boolean hideCorrectAnswerOnWrong, LocalDateTime openTime, LocalDateTime closeTime) {
            this(id, assignmentType, classIds, studentIds, scoreVisibility, answerVisibility, threshold,
                    hideCorrectAnswerOnWrong, openTime, closeTime, null);
        }
        public CreateCompleteExamRequest.Assignment toCreateAssignment() {
            return new CreateCompleteExamRequest.Assignment(assignmentType, classIds, studentIds,
                    scoreVisibility, answerVisibility, threshold, hideCorrectAnswerOnWrong, openTime, closeTime, classId);
        }
    }
}
