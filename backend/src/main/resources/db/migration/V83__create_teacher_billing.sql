CREATE TABLE teacher_point_wallets (
    teacher_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    points_balance BIGINT NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
    version BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teacher_point_ledger (
    id BIGSERIAL PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_key VARCHAR(120) NOT NULL UNIQUE,
    entry_type VARCHAR(10) NOT NULL CHECK (entry_type IN ('CREDIT', 'DEBIT')),
    points BIGINT NOT NULL CHECK (points > 0),
    reason VARCHAR(40) NOT NULL,
    order_id UUID,
    balance_after BIGINT NOT NULL CHECK (balance_after >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teacher_point_ledger_teacher_created
    ON teacher_point_ledger (teacher_id, created_at DESC, id DESC);

CREATE TABLE billing_orders (
    id UUID PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    request_id UUID NOT NULL,
    product_code VARCHAR(60) NOT NULL,
    product_type VARCHAR(10) NOT NULL CHECK (product_type IN ('POINTS', 'VIP')),
    amount_vnd BIGINT NOT NULL CHECK (amount_vnd > 0),
    points_granted INTEGER NOT NULL DEFAULT 0 CHECK (points_granted >= 0),
    points_required INTEGER NOT NULL DEFAULT 0 CHECK (points_required >= 0),
    vip_tier VARCHAR(20),
    device_limit INTEGER NOT NULL DEFAULT 0 CHECK (device_limit >= 0),
    duration_months INTEGER NOT NULL DEFAULT 0 CHECK (duration_months >= 0),
    status VARCHAR(12) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'CREATING', 'PAID', 'FAILED', 'EXPIRED')),
    momo_transaction_id VARCHAR(100) UNIQUE,
    pay_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    UNIQUE (teacher_id, request_id)
);

CREATE INDEX idx_billing_orders_teacher_created
    ON billing_orders (teacher_id, created_at DESC, id DESC);

CREATE TABLE teacher_vip_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vip_tier VARCHAR(20) NOT NULL CHECK (vip_tier IN ('PERSONAL', 'FIVE_DEVICES', 'TEN_DEVICES')),
    device_limit INTEGER NOT NULL CHECK (device_limit > 0),
    expires_at TIMESTAMPTZ NOT NULL,
    last_order_id UUID REFERENCES billing_orders(id) ON DELETE RESTRICT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (teacher_id, vip_tier)
);

CREATE INDEX idx_teacher_vip_subscriptions_active
    ON teacher_vip_subscriptions (teacher_id, expires_at DESC, device_limit DESC);