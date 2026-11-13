package com.classmanagement.backend.dto.billing;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import com.classmanagement.backend.entity.enums.MissionType;

public record MissionRequest(
        @NotBlank String name,
        @NotBlank String description,
        @Min(0) int rewardPoints,
        @NotNull MissionType missionType,
        @Min(1) int targetValue,
        @NotBlank String status,
        int sortOrder) {}
