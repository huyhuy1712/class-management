CREATE TABLE exam_attempts (
    id BIGSERIAL PRIMARY KEY,

    assignment_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,

    attempt_count INTEGER NOT NULL DEFAULT 0,
    tab_switch_count INTEGER NOT NULL DEFAULT 0,

    started_at TIMESTAMP,
    submitted_at TIMESTAMP,

    duration_seconds INTEGER,

    auto_score DECIMAL(6,2) NOT NULL DEFAULT 0,
    manual_score DECIMAL(6,2) NOT NULL DEFAULT 0,
    total_score DECIMAL(6,2) NOT NULL DEFAULT 0,

    status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',

    teacher_comment TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_exam_attempts_assignment
        FOREIGN KEY (assignment_id)
        REFERENCES exam_assignments(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_exam_attempts_student
        FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_exam_attempts_assignment_student
        UNIQUE (assignment_id, student_id),

    CONSTRAINT chk_exam_attempts_attempt_count
        CHECK (attempt_count >= 0),

    CONSTRAINT chk_exam_attempts_tab_switch_count
        CHECK (tab_switch_count >= 0),

    CONSTRAINT chk_exam_attempts_duration
        CHECK (duration_seconds IS NULL OR duration_seconds >= 0),

    CONSTRAINT chk_exam_attempts_scores
        CHECK (
            auto_score >= 0
            AND manual_score >= 0
            AND total_score >= 0
        ),

    CONSTRAINT chk_exam_attempts_status
        CHECK (
            status IN (
                'NOT_STARTED',
                'IN_PROGRESS',
                'SUBMITTED',
                'GRADED'
            )
        )
);

CREATE INDEX idx_exam_attempts_student_id
    ON exam_attempts(student_id);

CREATE INDEX idx_exam_attempts_assignment_status
    ON exam_attempts(assignment_id, status);