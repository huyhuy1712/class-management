package com.classmanagement.backend.dto.exam;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.UUID;

public record CreateExamAssignmentRequest(@NotNull UUID requestId,
        @NotNull @Valid CreateCompleteExamRequest.Assignment assignment,
        @NotNull @Min(1) Integer timeLimit, @NotNull @Min(0) Integer maxAttempts) {}
