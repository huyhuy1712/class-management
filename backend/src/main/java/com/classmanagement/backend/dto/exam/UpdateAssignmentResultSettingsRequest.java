package com.classmanagement.backend.dto.exam;

import com.classmanagement.backend.entity.enums.AnswerVisibility;
import com.classmanagement.backend.entity.enums.ScoreVisibility;
import jakarta.validation.constraints.NotNull;

public record UpdateAssignmentResultSettingsRequest(
        @NotNull ScoreVisibility scoreVisibility,
        @NotNull AnswerVisibility answerVisibility,
        @NotNull Boolean hideCorrectAnswerOnWrong) {}
