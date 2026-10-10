package com.classmanagement.backend.dto.notification;

import com.classmanagement.backend.entity.enums.NotificationType;
import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        NotificationType type,
        String title,
        String message,
        String referenceType,
        Long referenceId,
        boolean read,
        LocalDateTime createdAt) {
}
