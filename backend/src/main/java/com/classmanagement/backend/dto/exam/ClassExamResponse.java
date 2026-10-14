package com.classmanagement.backend.dto.exam;

import java.time.LocalDateTime;

public record ClassExamResponse(Long assignmentId, Long examId, String title, String code,
        String examStatus, String assignmentStatus, String assignmentType, Integer timeLimit,
        LocalDateTime openTime, LocalDateTime closeTime, LocalDateTime createdAt,
        long gradedCount, long pendingGradingCount) {}
