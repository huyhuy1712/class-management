ALTER TABLE homework_assignments
    ADD COLUMN audio_path TEXT,
    ADD COLUMN audio_name VARCHAR(255),
    ADD COLUMN audio_size BIGINT,
    ADD COLUMN audio_content_type VARCHAR(255);

CREATE TABLE homework_submission_audio (
    submission_id BIGINT PRIMARY KEY REFERENCES homework_submissions(id) ON DELETE CASCADE,
    object_path TEXT NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_homework_submission_audio_size CHECK (file_size > 0)
);
