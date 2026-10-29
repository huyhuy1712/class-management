package com.classmanagement.backend.dto.billing;

import com.classmanagement.backend.entity.billing.BillingOrder;
import java.time.OffsetDateTime;
import java.util.UUID;

public record BillingOrderResponse(
        UUID orderId,
        String productCode,
        long amountVnd,
        String status,
        String payUrl,
        OffsetDateTime expiresAt) {
    public static BillingOrderResponse from(BillingOrder order) {
        return new BillingOrderResponse(
                order.getId(),
                order.getProductCode(),
                order.getAmountVnd(),
                order.getStatus().name(),
                order.getPayUrl(),
                order.getExpiresAt());
    }
}