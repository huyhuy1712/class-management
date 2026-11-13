CREATE TABLE billing_invoices (
    id UUID PRIMARY KEY,
    invoice_number VARCHAR(40) NOT NULL UNIQUE,
    teacher_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    billing_order_id UUID NOT NULL UNIQUE REFERENCES billing_orders(id) ON DELETE RESTRICT,

    status VARCHAR(12) NOT NULL DEFAULT 'ISSUED'
        CHECK (status IN ('ISSUED', 'VOID')),
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    payment_method VARCHAR(30) NOT NULL DEFAULT 'MOMO',
    payment_transaction_id VARCHAR(100) UNIQUE,

    customer_username VARCHAR(50) NOT NULL,
    customer_full_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),

    subtotal_vnd BIGINT NOT NULL CHECK (subtotal_vnd >= 0),
    discount_vnd BIGINT NOT NULL DEFAULT 0 CHECK (discount_vnd >= 0),
    total_vnd BIGINT NOT NULL CHECK (total_vnd >= 0),
    paid_at TIMESTAMPTZ NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    voided_at TIMESTAMPTZ,
    void_reason VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_billing_invoice_total
        CHECK (total_vnd = subtotal_vnd - discount_vnd),
    CONSTRAINT chk_billing_invoice_void_data
        CHECK (
            (status = 'ISSUED' AND voided_at IS NULL)
            OR (status = 'VOID' AND voided_at IS NOT NULL)
        )
);

CREATE INDEX idx_billing_invoices_teacher_issued
    ON billing_invoices (teacher_id, issued_at DESC, id DESC);

CREATE INDEX idx_billing_invoices_payment_transaction
    ON billing_invoices (payment_transaction_id)
    WHERE payment_transaction_id IS NOT NULL;
