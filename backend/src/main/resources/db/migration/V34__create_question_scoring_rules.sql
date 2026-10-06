CREATE TABLE question_scoring_rules (
    id BIGSERIAL PRIMARY KEY,

    question_id BIGINT NOT NULL,

    correct_count INTEGER NOT NULL,
    score DECIMAL(6,2) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_question_scoring_rules_question
        FOREIGN KEY (question_id)
        REFERENCES questions(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_question_scoring_rules_count
        UNIQUE (question_id, correct_count),

    CONSTRAINT chk_question_scoring_rules_correct_count
        CHECK (correct_count >= 0),

    CONSTRAINT chk_question_scoring_rules_score
        CHECK (score >= 0)
);

CREATE INDEX idx_question_scoring_rules_question_id
    ON question_scoring_rules(question_id);