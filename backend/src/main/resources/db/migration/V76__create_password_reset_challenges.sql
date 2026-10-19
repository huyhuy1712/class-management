CREATE TABLE password_reset_challenges (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    verification_code_hash VARCHAR(100),
    verification_expires_at TIMESTAMP,
    verification_sent_at TIMESTAMP,
    verification_attempts INTEGER NOT NULL DEFAULT 0,
    reset_token_hash VARCHAR(100),
    reset_token_expires_at TIMESTAMP
);
