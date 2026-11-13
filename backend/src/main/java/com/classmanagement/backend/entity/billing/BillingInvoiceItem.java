package com.classmanagement.backend.entity.billing;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "billing_invoice_items")
@Getter
@Setter
@NoArgsConstructor
public class BillingInvoiceItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_id", nullable = false)
    private UUID invoiceId;

    @Column(name = "line_number", nullable = false)
    private int lineNumber;

    @Column(name = "product_code", nullable = false)
    private String productCode;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "product_type", nullable = false)
    private String productType;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "unit_price_vnd", nullable = false)
    private long unitPriceVnd;

    @Column(name = "line_total_vnd", nullable = false)
    private long lineTotalVnd;

    @Column(name = "points_granted", nullable = false)
    private int pointsGranted;

    @Column(name = "points_required", nullable = false)
    private int pointsRequired;

    @Column(name = "vip_tier")
    private String vipTier;

    @Column(name = "device_limit", nullable = false)
    private int deviceLimit;

    @Column(name = "duration_months", nullable = false)
    private int durationMonths;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;
}
