package com.classmanagement.backend.dto.activity;

import com.classmanagement.backend.entity.enums.UserRole;

import java.time.LocalDateTime;

public record AdminAuditLogItem(
        Long id,
        Long actorId,
        String actorName,
        String actorUsername,
        UserRole actorRole,
        String action,
        String resourceType,
        Long resourceId,
        String summary,
        LocalDateTime occurredAt) {
}
