CREATE TABLE exams (
    id BIGSERIAL PRIMARY KEY,

    teacher_id BIGINT NOT NULL,

    title VARCHAR(255) NOT NULL,

    time_limit INTEGER,
    max_attempts INTEGER,
    max_score NUMERIC(10, 2) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_exams_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES users(id),

    CONSTRAINT chk_exams_time_limit
        CHECK (time_limit IS NULL OR time_limit > 0),

    CONSTRAINT chk_exams_max_attempts
        CHECK (max_attempts IS NULL OR max_attempts > 0),

    CONSTRAINT chk_exams_max_score
        CHECK (max_score > 0)
);