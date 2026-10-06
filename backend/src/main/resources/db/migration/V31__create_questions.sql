CREATE TABLE questions (
    id BIGSERIAL PRIMARY KEY,

    section_id BIGINT NOT NULL,

    content TEXT NOT NULL,

    image_url TEXT,
    audio_url TEXT,

    order_index INTEGER NOT NULL,
    points DECIMAL(6,2) NOT NULL DEFAULT 0,

    scoring_type VARCHAR(30) NOT NULL DEFAULT 'PER_ANSWER',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_questions_section
        FOREIGN KEY (section_id)
        REFERENCES exam_sections(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_questions_section_order
        UNIQUE (section_id, order_index),

    CONSTRAINT chk_questions_points
        CHECK (points >= 0),

    CONSTRAINT chk_questions_scoring_type
        CHECK (scoring_type IN ('PER_ANSWER', 'CORRECT_COUNT'))
);

CREATE INDEX idx_questions_section_id
    ON questions(section_id);