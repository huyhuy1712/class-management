CREATE TABLE admin_activity_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(40) NOT NULL,
    resource_type VARCHAR(40) NOT NULL,
    resource_id BIGINT,
    summary VARCHAR(500) NOT NULL,
    occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_activity_time
    ON admin_activity_logs(occurred_at DESC, id DESC);

CREATE INDEX idx_admin_activity_actor_time
    ON admin_activity_logs(actor_id, occurred_at DESC, id DESC);
