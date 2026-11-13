package com.classmanagement.backend.dto.billing;

import java.time.OffsetDateTime;

public record BillingMissionResponse(
        String code,
        String name,
        String description,
        int rewardPoints,
        String status,
        OffsetDateTime claimedAt,
        boolean eligible) {}
