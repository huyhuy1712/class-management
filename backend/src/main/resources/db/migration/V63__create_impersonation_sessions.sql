CREATE TABLE impersonation_sessions (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id BIGINT NOT NULL,
    target_user_id BIGINT NOT NULL,
    reason VARCHAR(500),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    end_reason VARCHAR(30),
    CONSTRAINT chk_impersonation_session_distinct_users
        CHECK (admin_user_id <> target_user_id)
);

CREATE INDEX idx_impersonation_sessions_active_expiry
    ON impersonation_sessions (id, expires_at)
    WHERE ended_at IS NULL;

CREATE INDEX idx_impersonation_sessions_admin_started
    ON impersonation_sessions (admin_user_id, started_at DESC);
