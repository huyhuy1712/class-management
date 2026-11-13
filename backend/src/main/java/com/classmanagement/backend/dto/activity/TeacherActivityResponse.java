package com.classmanagement.backend.dto.activity;

import java.util.List;

public record TeacherActivityResponse(
        List<TeacherActivityItem> items,
        int page,
        int size,
        long totalElements,
        int totalPages,
        TeacherActivitySummary summary) {
}
