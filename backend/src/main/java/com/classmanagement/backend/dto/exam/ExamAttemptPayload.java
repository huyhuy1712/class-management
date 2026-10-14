package com.classmanagement.backend.dto.exam;

import com.classmanagement.backend.entity.enums.ExamAttemptEventType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public final class ExamAttemptPayload {
    private ExamAttemptPayload() {}
    public record Start(@NotNull UUID requestId,@NotNull @Min(0) Integer expectedAttemptCount) {}
    public record BooleanAnswer(@NotNull @Positive Long optionId,@NotNull Boolean value) {}
    public record Value(@NotNull @Positive Long answerId,@Size(max=20000) String text,
            @Size(max=50) List<@NotNull @Positive Long> selectedOptionIds,
            @Size(max=50) List<@NotNull @Valid BooleanAnswer> booleanAnswers) {}
    public record Event(@NotNull UUID eventId,@NotNull ExamAttemptEventType type) {}
    public record Save(@NotNull @Min(1) Integer attemptNumber,@NotNull @Min(0) Long revision,
            @NotNull @Size(max=2000) List<@NotNull @Valid Value> answers,
            @Size(max=1000) List<@NotNull @Valid Event> events) {}
    public record Grade(@NotNull @Positive Long answerId,@NotNull @DecimalMin("0") @Digits(integer=4,fraction=2) BigDecimal score) {}
    public record Grades(@NotNull @Min(1) Integer attemptNumber,@NotNull @Min(0) Long revision,
            @Size(max=2000) List<@NotNull @Valid Grade> grades,@Size(max=20000) String teacherComment) {}
}
