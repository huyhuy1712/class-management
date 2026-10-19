ALTER TABLE users
    ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN email_verification_code_hash VARCHAR(100),
    ADD COLUMN email_verification_expires_at TIMESTAMP,
    ADD COLUMN email_verification_sent_at TIMESTAMP,
    ADD COLUMN email_verification_attempts INTEGER NOT NULL DEFAULT 0;
