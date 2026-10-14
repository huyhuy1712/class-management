package com.classmanagement.backend.dto.exam;

import com.classmanagement.backend.entity.enums.ExamAssignmentType;
import com.classmanagement.backend.entity.enums.ExamAttemptStatus;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record StudentClassExamResultsResponse(Long classId,Long studentId,List<Item> items,int page,int size,long totalElements,Summary summary) {
    public record Item(Long assignmentId,Long examId,String title,String code,ExamAssignmentType assignmentType,
            Long attemptId,int attemptNumber,ExamAttemptStatus status,BigDecimal maxScore,BigDecimal totalScore,
            BigDecimal scoreOnTen,boolean isFinal,OffsetDateTime submittedAt,Integer durationSeconds,String teacherComment) {}
    public record Summary(long total,long notStarted,long inProgress,long submitted,long pendingGrading,long graded,
            BigDecimal averageScoreOnTen,BigDecimal highestScoreOnTen,BigDecimal lowestScoreOnTen) {}
}
