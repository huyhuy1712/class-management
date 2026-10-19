package com.classmanagement.backend.dto.exam;

import com.classmanagement.backend.entity.enums.ExamStatus;

import java.time.LocalDateTime;
import java.util.List;

public record ExamListResponse(
        Long id,
        Long subjectId,
        String subjectName,
        String title,
        String code,
        String description,
        String gradeLevel,
        String purpose,
        long submittedCount,
        ExamStatus status,
        long assignedClassCount,
        LocalDateTime createdAt,
        List<String> assignedTo) {
}