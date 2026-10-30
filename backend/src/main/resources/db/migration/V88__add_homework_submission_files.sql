CREATE TABLE homework_submission_files (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL REFERENCES homework_submissions(id) ON DELETE CASCADE,
    object_path TEXT NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_homework_submission_file_order UNIQUE (submission_id, order_index),
    CONSTRAINT chk_homework_submission_file_order CHECK (order_index >= 1),
    CONSTRAINT chk_homework_submission_file_size CHECK (file_size > 0)
);

CREATE INDEX idx_homework_submission_files_submission
    ON homework_submission_files(submission_id);
