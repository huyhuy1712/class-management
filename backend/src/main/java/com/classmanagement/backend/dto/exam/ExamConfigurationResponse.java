package com.classmanagement.backend.dto.exam;

import com.classmanagement.backend.entity.enums.ExamStatus;
import com.classmanagement.backend.entity.enums.ExamAssignmentStatus;
import com.classmanagement.backend.entity.enums.ExamAssignmentType;
import com.classmanagement.backend.entity.enums.ScoreVisibility;
import com.classmanagement.backend.entity.enums.AnswerVisibility;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ExamConfigurationResponse(
        Long id, String code, ExamStatus status, BigDecimal maxScore,
        LocalDateTime updatedAt, BasicInfo basicInfo, List<Assignment> assignments, Long revision) {

    public record BasicInfo(String title, Long subjectId, String subjectName,
            String gradeLevel, String purpose, String description,
            Integer timeLimit, Integer maxAttempts) {}

    public record Assignment(Long id, ExamAssignmentStatus status,
            ExamAssignmentType assignmentType, List<Long> classIds, List<Long> studentIds,
            Integer timeLimit, Integer maxAttempts, ScoreVisibility scoreVisibility,
            AnswerVisibility answerVisibility, BigDecimal threshold,
            Boolean hideCorrectAnswerOnWrong, LocalDateTime openTime,
            LocalDateTime closeTime, LocalDateTime updatedAt) {}
}
