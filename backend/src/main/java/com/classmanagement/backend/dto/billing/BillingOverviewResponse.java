package com.classmanagement.backend.dto.billing;

import com.classmanagement.backend.service.billing.BillingProductCatalog.Product;
import java.time.OffsetDateTime;
import java.util.List;

public record BillingOverviewResponse(
        long pointsBalance,
        boolean paymentEnabled,
        String vipTier,
        int deviceLimit,
        OffsetDateTime vipExpiresAt,
        List<Product> products,
        List<Subscription> subscriptions,
        List<LedgerEntry> recentLedger) {
    public record Subscription(
            String vipTier,
            int deviceLimit,
            OffsetDateTime expiresAt) {}

    public record LedgerEntry(
            String entryType,
            long points,
            String reason,
            long balanceAfter,
            OffsetDateTime createdAt) {}
}