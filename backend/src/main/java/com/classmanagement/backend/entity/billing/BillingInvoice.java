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
@Table(name = "billing_invoices")
@Getter
@Setter
@NoArgsConstructor
public class BillingInvoice {
    public enum Status {
        ISSUED,
        VOID
    }

    @Id
    private UUID id;

    @Column(name = "invoice_number", nullable = false, unique = true)
    private String invoiceNumber;

    @Column(name = "teacher_id", nullable = false)
    private Long teacherId;

    @Column(name = "billing_order_id", nullable = false, unique = true)
    private UUID billingOrderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(nullable = false)
    private String currency;

    @Column(name = "payment_method", nullable = false)
    private String paymentMethod;

    @Column(name = "payment_transaction_id", unique = true)
    private String paymentTransactionId;

    @Column(name = "customer_username", nullable = false)
    private String customerUsername;

    @Column(name = "customer_full_name", nullable = false)
    private String customerFullName;

    @Column(name = "customer_email", nullable = false)
    private String customerEmail;

    @Column(name = "customer_phone")
    private String customerPhone;

    @Column(name = "subtotal_vnd", nullable = false)
    private long subtotalVnd;

    @Column(name = "discount_vnd", nullable = false)
    private long discountVnd;

    @Column(name = "total_vnd", nullable = false)
    private long totalVnd;

    @Column(name = "paid_at", nullable = false)
    private OffsetDateTime paidAt;

    @Column(name = "issued_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime issuedAt;
}
