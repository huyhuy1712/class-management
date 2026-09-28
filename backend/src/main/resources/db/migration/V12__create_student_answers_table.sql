CREATE TABLE student_answers (
    id BIGSERIAL PRIMARY KEY,

    attempt_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,

    selected_option_id BIGINT,
    answer_text TEXT,

    score NUMERIC(10, 2),
    teacher_comment TEXT,

    CONSTRAINT fk_student_answers_attempt
        FOREIGN KEY (attempt_id)
        REFERENCES exam_attempts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_student_answers_question
        FOREIGN KEY (question_id)
        REFERENCES questions(id),

    CONSTRAINT fk_student_answers_option
        FOREIGN KEY (selected_option_id)
        REFERENCES question_options(id),

    CONSTRAINT uq_student_answers_attempt_question
        UNIQUE (attempt_id, question_id),

    CONSTRAINT chk_student_answers_score
        CHECK (score IS NULL OR score >= 0)
);