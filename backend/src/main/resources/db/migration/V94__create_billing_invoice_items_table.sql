CREATE TABLE billing_invoice_items (
    id BIGSERIAL PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES billing_invoices(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL CHECK (line_number > 0),

    product_code VARCHAR(60) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_type VARCHAR(10) NOT NULL CHECK (product_type IN ('POINTS', 'VIP')),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price_vnd BIGINT NOT NULL CHECK (unit_price_vnd >= 0),
    line_total_vnd BIGINT NOT NULL CHECK (line_total_vnd >= 0),

    points_granted INTEGER NOT NULL DEFAULT 0 CHECK (points_granted >= 0),
    points_required INTEGER NOT NULL DEFAULT 0 CHECK (points_required >= 0),
    vip_tier VARCHAR(20),
    device_limit INTEGER NOT NULL DEFAULT 0 CHECK (device_limit >= 0),
    duration_months INTEGER NOT NULL DEFAULT 0 CHECK (duration_months >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_billing_invoice_item_line UNIQUE (invoice_id, line_number),
    CONSTRAINT chk_billing_invoice_item_total
        CHECK (line_total_vnd = quantity * unit_price_vnd)
);

CREATE INDEX idx_billing_invoice_items_invoice
    ON billing_invoice_items (invoice_id, line_number);
