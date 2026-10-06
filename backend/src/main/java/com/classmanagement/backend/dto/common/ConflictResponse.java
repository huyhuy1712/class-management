package com.classmanagement.backend.dto.common;

public record ConflictResponse(
        String message,
        boolean requiresConfirmation) {
}