CREATE TABLE exam_attempts (
    id BIGSERIAL PRIMARY KEY,

    class_exam_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,

    attempt_number INTEGER NOT NULL,

    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,

    duration_seconds INTEGER,

    mc_score NUMERIC(10, 2),
    short_score NUMERIC(10, 2),
    tf_score NUMERIC(10, 2),
    essay_score NUMERIC(10, 2),
    total_score NUMERIC(10, 2),

    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',

    teacher_comment TEXT,

    CONSTRAINT fk_exam_attempts_class_exam
        FOREIGN KEY (class_exam_id)
        REFERENCES class_exams(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_exam_attempts_student
        FOREIGN KEY (student_id)
        REFERENCES users(id),

    CONSTRAINT uq_exam_attempts
        UNIQUE (class_exam_id, student_id, attempt_number),

    CONSTRAINT chk_exam_attempts_attempt_number
        CHECK (attempt_number > 0),

    CONSTRAINT chk_exam_attempts_duration
        CHECK (duration_seconds IS NULL OR duration_seconds >= 0),

    CONSTRAINT chk_exam_attempts_status
        CHECK (
            status IN (
                'IN_PROGRESS',
                'SUBMITTED',
                'PENDING_GRADING',
                'GRADED'
            )
        )
);

CREATE INDEX idx_exam_attempts_student
    ON exam_attempts(student_id);