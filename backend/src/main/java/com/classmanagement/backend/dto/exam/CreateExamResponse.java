package com.classmanagement.backend.dto.exam;

import com.classmanagement.backend.entity.enums.ExamStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CreateExamResponse(Long id, String code, ExamStatus status, BigDecimal maxScore,
                                 Long assignmentId, LocalDateTime updatedAt) {}
