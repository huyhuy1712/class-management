CREATE TABLE student_answers (
    id BIGSERIAL PRIMARY KEY,

    attempt_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,

    auto_score DECIMAL(6,2),
    manual_score DECIMAL(6,2),

    grading_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    teacher_comment TEXT,

    graded_by BIGINT,
    graded_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_student_answers_attempt
        FOREIGN KEY (attempt_id)
        REFERENCES exam_attempts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_student_answers_question
        FOREIGN KEY (question_id)
        REFERENCES questions(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_student_answers_graded_by
        FOREIGN KEY (graded_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT uq_student_answers_attempt_question
        UNIQUE (attempt_id, question_id),

    CONSTRAINT chk_student_answers_auto_score
        CHECK (auto_score IS NULL OR auto_score >= 0),

    CONSTRAINT chk_student_answers_manual_score
        CHECK (manual_score IS NULL OR manual_score >= 0),

    CONSTRAINT chk_student_answers_grading_status
        CHECK (
            grading_status IN (
                'PENDING',
                'AUTO_GRADED',
                'MANUAL_GRADED'
            )
        )
);

CREATE INDEX idx_student_answers_question_id
    ON student_answers(question_id);

CREATE INDEX idx_student_answers_grading_status
    ON student_answers(grading_status);