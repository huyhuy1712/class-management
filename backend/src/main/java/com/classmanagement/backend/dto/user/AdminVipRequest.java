package com.classmanagement.backend.dto.user;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record AdminVipRequest(
        @NotBlank String vipTier,
        @Min(1) @Max(1200) Integer durationMonths,
        boolean permanent) {
}
