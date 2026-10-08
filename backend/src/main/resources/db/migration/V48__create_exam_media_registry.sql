CREATE TABLE exam_media (
    id UUID PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES users(id),
    draft_token UUID NOT NULL,
    object_path VARCHAR(500) NOT NULL UNIQUE,
    media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('IMAGE', 'AUDIO')),
    content_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('UPLOADING', 'TEMP', 'ATTACHED', 'DELETE_PENDING')),
    exam_id BIGINT REFERENCES exams(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    next_cleanup_at TIMESTAMP NOT NULL,
    cleanup_attempts INTEGER NOT NULL DEFAULT 0 CHECK (cleanup_attempts >= 0)
);

CREATE INDEX idx_exam_media_cleanup ON exam_media(status, next_cleanup_at);
CREATE INDEX idx_exam_media_draft ON exam_media(teacher_id, draft_token);
CREATE INDEX idx_exam_media_exam ON exam_media(exam_id);
