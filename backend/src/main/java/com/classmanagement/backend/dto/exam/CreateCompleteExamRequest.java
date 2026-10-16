package com.classmanagement.backend.dto.exam;

import com.classmanagement.backend.entity.enums.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record CreateCompleteExamRequest(
        @NotNull @Valid BasicInfo basicInfo,
        @NotNull @Valid Assignment assignment,
        UUID draftToken,
        @NotEmpty @Size(max = 50) List<@NotNull @Valid Section> sections,
        @Valid ImportReview importReview) {

    public CreateCompleteExamRequest(
            BasicInfo basicInfo, Assignment assignment, UUID draftToken, List<Section> sections) {
        this(basicInfo, assignment, draftToken, sections, null);
    }

    /** Explicit review of the whole source, including formulas the detector may have missed. */
    public record ImportReview(
            @NotNull UUID importId,
            @NotNull @AssertTrue Boolean sourceReviewed,
            @NotNull @Size(max = 150) List<@NotNull UUID> illustrationAssetIds,
            @Size(max = 150) List<@NotNull @Valid IllustrationTarget> illustrationTargets) {
        public ImportReview(UUID importId, Boolean sourceReviewed, List<UUID> illustrationAssetIds) {
            this(importId, sourceReviewed, illustrationAssetIds, null);
        }
    }

    /** Zero-based edited destinations, required when selected source images are reordered. */
    public record IllustrationTarget(
            @NotNull UUID assetId,
            @NotNull @Min(0) Integer sectionIndex,
            @NotNull @Min(0) Integer questionIndex,
            @Min(0) Integer answerIndex,
            @Min(0) Integer optionIndex) {}

    public record BasicInfo(
            @NotBlank @Size(max = 255) String title,
            @NotNull @Positive Long subjectId,
            @NotBlank @Size(max = 30) String gradeLevel,
            @Size(max = 20000) String description,
            @Size(max = 50) String purpose,
            @NotNull @Min(1) Integer timeLimit,
            @NotNull @Min(0) Integer maxAttempts) {}

    public record Assignment(
            @NotNull ExamAssignmentType assignmentType,
            @Size(max = 500) List<@NotNull @Positive Long> classIds,
            @Size(max = 2000) List<@NotNull @Positive Long> studentIds,
            @NotNull ScoreVisibility scoreVisibility,
            @NotNull AnswerVisibility answerVisibility,
            @DecimalMin("0") @Digits(integer = 4, fraction = 2) BigDecimal answerVisibilityScore,
            @NotNull Boolean hideCorrectAnswerOnWrong,
            LocalDateTime openTime,
            LocalDateTime closeTime,
            @Positive Long classId) {
        public Assignment(ExamAssignmentType assignmentType, List<Long> classIds, List<Long> studentIds,
                ScoreVisibility scoreVisibility, AnswerVisibility answerVisibility, BigDecimal answerVisibilityScore,
                Boolean hideCorrectAnswerOnWrong, LocalDateTime openTime, LocalDateTime closeTime) {
            this(assignmentType, classIds, studentIds, scoreVisibility, answerVisibility, answerVisibilityScore,
                    hideCorrectAnswerOnWrong, openTime, closeTime, null);
        }
    }

    public record Section(
            @NotBlank @Size(max = 255) String title,
            @Size(max = 20000) String paragraph,
            UUID imageMediaId, UUID audioMediaId,
            @NotEmpty @Size(max = 100) List<@NotNull @Valid Question> questions) {}

    public record Question(
            @NotBlank @Size(max = 20000) String content,
            @Size(max = 20000) String explanation,
            UUID imageMediaId, UUID audioMediaId,
            @NotNull @DecimalMin("0.01") @Digits(integer = 4, fraction = 2) BigDecimal points,
            @NotEmpty @Size(max = 20) List<@NotNull @Valid Answer> answers,
            UUID explanationImageMediaId, UUID explanationAudioMediaId) {
        public Question(String content, String explanation, UUID imageMediaId, UUID audioMediaId, BigDecimal points, List<Answer> answers) {
            this(content, explanation, imageMediaId, audioMediaId, points, answers, null, null);
        }
    }

    // One Answer is one independently graded FE answerGroup.
    public record Answer(
            @NotNull AnswerType answerType,
            @Size(max = 20000) String content,
            UUID imageMediaId, UUID audioMediaId,
            @NotNull @DecimalMin("0") @Digits(integer = 4, fraction = 2) BigDecimal points,
            @NotNull ScoringType scoringType,
            @Size(max = 20000) String correctAnswerText,
            Boolean caseSensitive,
            @Size(max = 50) List<@NotNull @Valid Option> options,
            @Size(max = 51) List<@NotNull @Valid ScoringRule> scoringRules) {}

    public record Option(
            @Size(max = 20000) String content,
            UUID imageMediaId, UUID audioMediaId,
            @NotNull Boolean isCorrect,
            @DecimalMin("0") @Digits(integer = 4, fraction = 2) BigDecimal points) {}

    public record ScoringRule(
            @NotNull @Min(0) Integer correctCount,
            @NotNull @DecimalMin("0") @Digits(integer = 4, fraction = 2) BigDecimal score) {}
}
