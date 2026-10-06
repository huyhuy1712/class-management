CREATE TABLE exams (
    id BIGSERIAL PRIMARY KEY,

    teacher_id BIGINT NOT NULL,
    subject_id BIGINT,

    title VARCHAR(255) NOT NULL,
    description TEXT,

    grade_level VARCHAR(30),
    purpose VARCHAR(50),

    time_limit INTEGER,
    max_attempts INTEGER,

    max_score DECIMAL(6,2) NOT NULL DEFAULT 0,

    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_exams_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES users(id),

    CONSTRAINT fk_exams_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id),

    CONSTRAINT chk_exams_status
        CHECK (status IN ('DRAFT', 'PUBLISHED', 'CLOSED')),

    CONSTRAINT chk_exams_time_limit
        CHECK (time_limit IS NULL OR time_limit >= 0),

    CONSTRAINT chk_exams_max_attempts
        CHECK (max_attempts IS NULL OR max_attempts > 0),

    CONSTRAINT chk_exams_max_score
        CHECK (max_score >= 0)
);

CREATE INDEX idx_exams_teacher_id
    ON exams(teacher_id);

CREATE INDEX idx_exams_subject_id
    ON exams(subject_id);

CREATE INDEX idx_exams_teacher_status
    ON exams(teacher_id, status);