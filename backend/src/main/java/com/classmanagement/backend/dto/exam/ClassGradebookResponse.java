package com.classmanagement.backend.dto.exam;

import com.classmanagement.backend.entity.enums.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record ClassGradebookResponse(ClassInfo classroom,List<Column> columns,List<Student> items,int page,int size,long totalElements) {
    public record ClassInfo(Long id,String name,Long subjectId,String subjectName) {}
    public record Column(Long assignmentId,Long examId,String title,String code,ExamAssignmentType assignmentType,BigDecimal maxScore) {}
    public record Cell(Long assignmentId,boolean assigned,Long attemptId,int attemptNumber,ExamAttemptStatus status,
            BigDecimal totalScore,BigDecimal scoreOnTen,OffsetDateTime submittedAt) {}
    public record Student(Long studentId,String studentCode,String fullName,String email,String phone,String avatarUrl,
            OffsetDateTime joinedAt,BigDecimal averageScoreOnTen,long gradedCount,List<Cell> cells) {}
}
