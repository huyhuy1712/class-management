package com.classmanagement.backend.entity.billing;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "billing_orders")
@Getter
@Setter
@NoArgsConstructor
public class BillingOrder {
    public enum ProductType {
        POINTS,
        VIP
    }

    public enum Status {
        PENDING,
        CREATING,
        PAID,
        FAILED,
        EXPIRED
    }

    @Id
    private UUID id;

    @Column(name = "teacher_id", nullable = false)
    private Long teacherId;

    @Column(name = "request_id", nullable = false)
    private UUID requestId;

    @Column(name = "product_code", nullable = false)
    private String productCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "product_type", nullable = false)
    private ProductType productType;

    @Column(name = "amount_vnd", nullable = false)
    private long amountVnd;

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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(name = "momo_transaction_id")
    private String momoTransactionId;

    @Column(name = "pay_url", columnDefinition = "text")
    private String payUrl;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "paid_at")
    private OffsetDateTime paidAt;
}