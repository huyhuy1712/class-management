package com.classmanagement.backend.dto.exam;

import com.classmanagement.backend.entity.enums.ExamMediaType;
import java.time.LocalDateTime;
import java.util.UUID;

public record ExamMediaResponse(UUID mediaId, UUID draftToken, String path, String url,
                                ExamMediaType type, String contentType, long sizeBytes,
                                LocalDateTime expiresAt) {}
