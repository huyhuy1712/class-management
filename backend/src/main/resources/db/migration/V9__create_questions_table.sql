CREATE TABLE questions (
    id BIGSERIAL PRIMARY KEY,

    exam_id BIGINT NOT NULL,

    question_type VARCHAR(20) NOT NULL,

    image VARCHAR(500),
    content TEXT NOT NULL,

    order_index INTEGER NOT NULL,
    points NUMERIC(10, 2) NOT NULL,

    correct_answer_text TEXT,

    CONSTRAINT fk_questions_exam
        FOREIGN KEY (exam_id)
        REFERENCES exams(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_questions_type
        CHECK (question_type IN ('MCQ', 'TF', 'SHORT', 'ESSAY')),

    CONSTRAINT chk_questions_order
        CHECK (order_index > 0),

    CONSTRAINT chk_questions_points
        CHECK (points >= 0),

    CONSTRAINT uq_questions_exam_order
        UNIQUE (exam_id, order_index)
);