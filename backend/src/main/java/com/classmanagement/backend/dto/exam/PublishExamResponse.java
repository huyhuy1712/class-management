package com.classmanagement.backend.dto.exam;

import com.classmanagement.backend.entity.enums.ExamStatus;
import com.classmanagement.backend.entity.enums.ExamAssignmentStatus;
import java.time.LocalDateTime;
import java.util.List;

public record PublishExamResponse(Long id, String code, ExamStatus status, Long revision,
        LocalDateTime updatedAt, List<AssignmentStatus> assignments) {
    public record AssignmentStatus(Long id, ExamAssignmentStatus status) {}
}
