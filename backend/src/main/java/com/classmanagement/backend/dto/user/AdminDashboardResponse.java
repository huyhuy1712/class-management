package com.classmanagement.backend.dto.user;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminDashboardResponse {

    private long totalUsers;
    private long studentCount;
    private long teacherCount;
    private long pendingCount;
    private long bannedCount;
}
