CREATE TABLE attempt_section_scores (
    id BIGSERIAL PRIMARY KEY,

    attempt_id BIGINT NOT NULL,
    section_id BIGINT NOT NULL,

    auto_score DECIMAL(6,2) NOT NULL DEFAULT 0,
    manual_score DECIMAL(6,2) NOT NULL DEFAULT 0,
    total_score DECIMAL(6,2) NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_attempt_section_scores_attempt
        FOREIGN KEY (attempt_id)
        REFERENCES exam_attempts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_attempt_section_scores_section
        FOREIGN KEY (section_id)
        REFERENCES exam_sections(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_attempt_section_scores_attempt_section
        UNIQUE (attempt_id, section_id),

    CONSTRAINT chk_attempt_section_scores_values
        CHECK (
            auto_score >= 0
            AND manual_score >= 0
            AND total_score >= 0
        )
);

CREATE INDEX idx_attempt_section_scores_section_id
    ON attempt_section_scores(section_id);