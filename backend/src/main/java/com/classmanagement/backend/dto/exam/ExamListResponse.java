package com.classmanagement.backend.dto.exam;

import com.classmanagement.backend.entity.enums.ExamStatus;

import java.time.LocalDateTime;

public record ExamListResponse(
        Long id,
        String title,
        String code,
        long submittedCount,
        ExamStatus status,
        long assignedClassCount,
        LocalDateTime createdAt) {
}