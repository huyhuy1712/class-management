CREATE TABLE question_options (
    id BIGSERIAL PRIMARY KEY,

    question_id BIGINT NOT NULL,

    content TEXT,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    image VARCHAR(500),

    CONSTRAINT fk_question_options_question
        FOREIGN KEY (question_id)
        REFERENCES questions(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_question_options_content
        CHECK (content IS NOT NULL OR image IS NOT NULL)
);