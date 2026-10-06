package com.classmanagement.backend.dto.exam;

import com.classmanagement.backend.entity.enums.ExamStatus;


public record ExamUpdateResponse(
        Long id,
        Long subjectId,
        String subjectName,
        String title,
        String description,
        String gradeLevel,
        String purpose,
        ExamStatus status) {
}