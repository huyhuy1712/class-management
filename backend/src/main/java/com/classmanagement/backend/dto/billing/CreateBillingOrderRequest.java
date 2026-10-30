package com.classmanagement.backend.dto.billing;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateBillingOrderRequest(
        @NotBlank String productCode,
        @NotNull UUID requestId) {}