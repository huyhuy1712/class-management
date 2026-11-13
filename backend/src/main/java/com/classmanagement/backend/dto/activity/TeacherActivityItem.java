package com.classmanagement.backend.dto.activity;

import java.time.LocalDateTime;

public record TeacherActivityItem(
        Long id,
        String action,
        String resourceType,
        Long resourceId,
        Long classId,
        String summary,
        LocalDateTime occurredAt) {
}
