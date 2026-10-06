CREATE TABLE answer_options (
    id BIGSERIAL PRIMARY KEY,

    answer_id BIGINT NOT NULL,

    content TEXT,
    image_url TEXT,
    audio_url TEXT,

    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INTEGER NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_answer_options_answer
        FOREIGN KEY (answer_id)
        REFERENCES answers(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_answer_options_answer_order
        UNIQUE (answer_id, order_index)
);

CREATE INDEX idx_answer_options_answer_id
    ON answer_options(answer_id);