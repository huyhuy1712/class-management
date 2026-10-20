CREATE TABLE pending_signups (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    avatar VARCHAR(500),
    role VARCHAR(20) NOT NULL,
    verification_code_hash VARCHAR(100),
    verification_expires_at TIMESTAMP,
    verification_sent_at TIMESTAMP,
    verification_attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO pending_signups (
    username, password_hash, email, full_name, phone, avatar, role,
    verification_code_hash, verification_expires_at, verification_sent_at,
    verification_attempts, created_at, updated_at
)
SELECT username, password_hash, email, full_name, phone, avatar, role,
       email_verification_code_hash, email_verification_expires_at,
       email_verification_sent_at, email_verification_attempts,
       created_at, updated_at
FROM users
WHERE email_verified = FALSE;

DELETE FROM users WHERE email_verified = FALSE;

ALTER TABLE users
    DROP COLUMN email_verified,
    DROP COLUMN email_verification_code_hash,
    DROP COLUMN email_verification_expires_at,
    DROP COLUMN email_verification_sent_at,
    DROP COLUMN email_verification_attempts;
