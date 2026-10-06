CREATE TABLE student_answer_values (
    id BIGSERIAL PRIMARY KEY,

    student_answer_id BIGINT NOT NULL,
    answer_id BIGINT NOT NULL,

    answer_text TEXT,

    score DECIMAL(6,2),
    is_correct BOOLEAN,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_student_answer_values_student_answer
        FOREIGN KEY (student_answer_id)
        REFERENCES student_answers(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_student_answer_values_answer
        FOREIGN KEY (answer_id)
        REFERENCES answers(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_student_answer_values_answer
        UNIQUE (student_answer_id, answer_id),

    CONSTRAINT chk_student_answer_values_score
        CHECK (score IS NULL OR score >= 0)
);

CREATE INDEX idx_student_answer_values_answer_id
    ON student_answer_values(answer_id);