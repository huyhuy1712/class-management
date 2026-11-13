package com.classmanagement.backend.dto.activity;

import com.classmanagement.backend.entity.enums.UserRole;

import java.time.LocalDateTime;

public record AdminActivityItem(
        Long id,
        Long actorId,
        String actorName,
        String actorUsername,
        UserRole actorRole,
        String action,
        String resourceType,
        Long resourceId,
        Long classId,
        String summary,
        LocalDateTime occurredAt) {
}
