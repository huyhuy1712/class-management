ALTER TABLE users
    ALTER COLUMN password_hash DROP NOT NULL;

CREATE TABLE user_auth_identities (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(30) NOT NULL,
    provider_subject VARCHAR(255) NOT NULL,
    email_at_link VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_auth_identity_provider_subject UNIQUE (provider, provider_subject),
    CONSTRAINT uq_user_auth_identity_user_provider UNIQUE (user_id, provider)
);

CREATE INDEX idx_user_auth_identities_user_id ON user_auth_identities (user_id);
