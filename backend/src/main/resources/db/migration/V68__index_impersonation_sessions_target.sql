CREATE INDEX idx_impersonation_sessions_target_started
    ON impersonation_sessions (target_user_id, started_at DESC);
