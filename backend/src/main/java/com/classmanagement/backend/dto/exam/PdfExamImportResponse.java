package com.classmanagement.backend.dto.exam;

import java.time.OffsetDateTime;
import java.util.UUID;
import tools.jackson.databind.JsonNode;

/** Teacher-only response; preview includes answers and source evidence. */
public record PdfExamImportResponse(
        UUID importId,
        int examNumber,
        String status,
        String stage,
        int pollAfterMs,
        UUID draftToken,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        OffsetDateTime expiresAt,
        String errorCode,
        String errorMessage,
        JsonNode preview,
        CreateExamResponse createdExam) {}
