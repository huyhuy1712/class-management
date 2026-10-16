CREATE TABLE exam_import_jobs (
    id UUID PRIMARY KEY,
    owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id UUID NOT NULL,
    source_hash VARCHAR(64) NOT NULL,
    source_size BIGINT NOT NULL CHECK (source_size > 0 AND source_size <= 10485760),
    selected_exam_number INTEGER NOT NULL CHECK (selected_exam_number > 0),
    status VARCHAR(24) NOT NULL CHECK (status IN
        ('QUEUED', 'PROCESSING', 'READY_FOR_REVIEW', 'FAILED', 'EXPIRED')),
    stage VARCHAR(32) NOT NULL,
    draft_token UUID NOT NULL,
    result_payload TEXT CHECK (octet_length(result_payload) <= 4194304),
    error_code VARCHAR(80),
    error_message VARCHAR(500),
    lease_token UUID,
    lease_until TIMESTAMP,
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_exam_import_owner_request UNIQUE (owner_id, request_id)
);

CREATE INDEX idx_exam_import_claim ON exam_import_jobs(status, created_at)
    WHERE status IN ('QUEUED', 'PROCESSING');
CREATE INDEX idx_exam_import_expiry ON exam_import_jobs(expires_at)
    WHERE status <> 'EXPIRED';
