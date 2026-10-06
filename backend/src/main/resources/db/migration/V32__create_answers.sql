CREATE TABLE answers (
    id BIGSERIAL PRIMARY KEY,

    question_id BIGINT NOT NULL,

    answer_type VARCHAR(30) NOT NULL,

    content TEXT,
    image_url TEXT,
    audio_url TEXT,

    order_index INTEGER NOT NULL,
    points DECIMAL(6,2) NOT NULL DEFAULT 0,

    correct_answer_text TEXT,
    correct_boolean BOOLEAN,

    case_sensitive BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_answers_question
        FOREIGN KEY (question_id)
        REFERENCES questions(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_answers_question_order
        UNIQUE (question_id, order_index),

    CONSTRAINT chk_answers_type
        CHECK (
            answer_type IN (
                'SINGLE_CHOICE',
                'MULTIPLE_CHOICE',
                'TRUE_FALSE',
                'SHORT_ANSWER',
                'FILL_BLANK',
                'ESSAY'
            )
        ),

    CONSTRAINT chk_answers_points
        CHECK (points >= 0)
);

CREATE INDEX idx_answers_question_id
    ON answers(question_id);