CREATE TABLE exam_sections (
    id BIGSERIAL PRIMARY KEY,

    exam_id BIGINT NOT NULL,

    title VARCHAR(255) NOT NULL,
    description TEXT,

    image_url TEXT,
    audio_url TEXT,

    order_index INTEGER NOT NULL,
    points DECIMAL(6,2) NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_exam_sections_exam
        FOREIGN KEY (exam_id)
        REFERENCES exams(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_exam_sections_order
        UNIQUE (exam_id, order_index),

    CONSTRAINT chk_exam_sections_points
        CHECK (points >= 0)
);

CREATE INDEX idx_exam_sections_exam_id
    ON exam_sections(exam_id);