package com.classmanagement.backend.dto.billing;

import com.classmanagement.backend.entity.billing.BillingInvoice;
import com.classmanagement.backend.entity.billing.BillingInvoiceItem;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record BillingInvoiceResponse(
        UUID id,
        String invoiceNumber,
        String status,
        String currency,
        String paymentMethod,
        String paymentTransactionId,
        String customerUsername,
        String customerFullName,
        String customerEmail,
        String customerPhone,
        long subtotalVnd,
        long discountVnd,
        long totalVnd,
        OffsetDateTime paidAt,
        OffsetDateTime issuedAt,
        List<Item> items) {
    public record Item(
            String productCode,
            String productName,
            String productType,
            int quantity,
            long unitPriceVnd,
            long lineTotalVnd,
            int pointsGranted,
            int pointsRequired,
            String vipTier,
            int deviceLimit,
            int durationMonths) {
        static Item from(BillingInvoiceItem item) {
            return new Item(item.getProductCode(), item.getProductName(), item.getProductType(),
                    item.getQuantity(), item.getUnitPriceVnd(), item.getLineTotalVnd(),
                    item.getPointsGranted(), item.getPointsRequired(), item.getVipTier(),
                    item.getDeviceLimit(), item.getDurationMonths());
        }
    }

    public static BillingInvoiceResponse from(BillingInvoice invoice, List<BillingInvoiceItem> items) {
        return new BillingInvoiceResponse(
                invoice.getId(), invoice.getInvoiceNumber(), invoice.getStatus().name(),
                invoice.getCurrency(), invoice.getPaymentMethod(), invoice.getPaymentTransactionId(),
                invoice.getCustomerUsername(), invoice.getCustomerFullName(), invoice.getCustomerEmail(),
                invoice.getCustomerPhone(), invoice.getSubtotalVnd(), invoice.getDiscountVnd(),
                invoice.getTotalVnd(), invoice.getPaidAt(), invoice.getIssuedAt(),
                items.stream().map(Item::from).toList());
    }
}
