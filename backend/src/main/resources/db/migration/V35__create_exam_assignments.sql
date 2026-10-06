CREATE TABLE exam_assignments (
    id BIGSERIAL PRIMARY KEY,

    exam_id BIGINT NOT NULL,

    assignment_type VARCHAR(20) NOT NULL,

    open_time TIMESTAMP,
    close_time TIMESTAMP,

    time_limit INTEGER,
    max_attempts INTEGER,

    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_exam_assignments_exam
        FOREIGN KEY (exam_id)
        REFERENCES exams(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_exam_assignments_type
        CHECK (
            assignment_type IN (
                'ALL',
                'CLASS',
                'STUDENT'
            )
        ),

    CONSTRAINT chk_exam_assignments_status
        CHECK (
            status IN (
                'DRAFT',
                'SCHEDULED',
                'OPEN',
                'CLOSED'
            )
        ),

    CONSTRAINT chk_exam_assignments_time
        CHECK (
            open_time IS NULL
            OR close_time IS NULL
            OR open_time <= close_time
        ),

    CONSTRAINT chk_exam_assignments_time_limit
        CHECK (
            time_limit IS NULL
            OR time_limit >= 0
        ),

    CONSTRAINT chk_exam_assignments_max_attempts
        CHECK (
            max_attempts IS NULL
            OR max_attempts > 0
        )
);

CREATE INDEX idx_exam_assignments_exam_id
    ON exam_assignments(exam_id);

CREATE INDEX idx_exam_assignments_exam_status
    ON exam_assignments(exam_id, status);

CREATE INDEX idx_exam_assignments_status_time
    ON exam_assignments(status, open_time, close_time);