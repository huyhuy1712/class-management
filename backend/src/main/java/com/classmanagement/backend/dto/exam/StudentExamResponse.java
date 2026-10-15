package com.classmanagement.backend.dto.exam;

import java.time.LocalDateTime;
import java.util.List;

public record StudentExamResponse(Long assignmentId, Long examId, String title, String code,
        String description, String assignmentType, List<ClassInfo> classes,
        LocalDateTime openTime, LocalDateTime closeTime, Integer timeLimit, Integer maxAttempts,
        int attemptsUsed, Long attemptId, String attemptStatus,
        boolean canStart, boolean canResume, String blockedReason) {
    public record ClassInfo(Long id, String name) {}
    public record Stats(long completedCount, long notStartedCount, long pendingGradingCount) {}
    public record Page(List<StudentExamResponse> items, int page, int size, long totalElements, Stats stats) {}
}
