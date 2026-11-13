CREATE TABLE missions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(60) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(500) NOT NULL,
    reward_points INTEGER NOT NULL CHECK (reward_points > 0),
    mission_type VARCHAR(40) NOT NULL,
    target_value INTEGER NOT NULL DEFAULT 1 CHECK (target_value > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX idx_missions_status_schedule
    ON missions (status, starts_at, ends_at, sort_order);
