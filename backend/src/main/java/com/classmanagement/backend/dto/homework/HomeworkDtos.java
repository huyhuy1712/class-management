package com.classmanagement.backend.dto.homework;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class HomeworkDtos {
    private HomeworkDtos() {}

    public record Image(String name, String url, long size) {}

    public record Assignment(
            long id,
            String title,
            String instructions,
            Long subjectId,
            String subjectName,
            String gradeLevel,
            String purpose,
            String assignmentType,
            LocalDateTime dueAt,
            BigDecimal maxScore,
            String status,
            String attachmentName,
            String attachmentUrl,
            String audioName,
            String audioUrl,
            int recipientCount,
            int submittedCount,
            int gradedCount,
            LocalDateTime createdAt) {}

    public record Submission(
            long id,
            long studentId,
            String studentName,
            String studentCode,
            String status,
            String answerText,
            List<Image> images,
            String audioName,
            String audioUrl,
            LocalDateTime submittedAt,
            BigDecimal score,
            String teacherComment,
            int resubmissionCount) {}

    public record StudentAssignment(
            Assignment assignment,
            String submissionStatus,
            String answerText,
            List<Image> images,
            String audioName,
            String audioUrl,
            LocalDateTime submittedAt,
            BigDecimal score,
            String teacherComment,
            int resubmissionCount) {}

    public record GradeRequest(BigDecimal score, String teacherComment) {}

    public record DeadlineRequest(LocalDateTime dueAt) {}
}
