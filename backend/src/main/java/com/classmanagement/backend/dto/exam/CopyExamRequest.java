package com.classmanagement.backend.dto.exam;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CopyExamRequest(@NotNull UUID requestId) {}
