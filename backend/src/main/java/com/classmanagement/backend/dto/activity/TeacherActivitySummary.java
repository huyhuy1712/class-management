package com.classmanagement.backend.dto.activity;

public record TeacherActivitySummary(
        long totalActivities,
        long last30Days,
        long categoryCount) {
}
