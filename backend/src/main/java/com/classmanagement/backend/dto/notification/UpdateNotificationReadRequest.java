package com.classmanagement.backend.dto.notification;

import jakarta.validation.constraints.NotNull;

public record UpdateNotificationReadRequest(
        @NotNull(message = "Trạng thái read không được để trống") Boolean read) {
}
