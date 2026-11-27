package com.classmanagement.backend.dto.activity;

import java.util.List;

public record AdminAuditLogResponse(
        List<AdminAuditLogItem> items,
        int page,
        int size,
        long totalElements,
        int totalPages) {
}
