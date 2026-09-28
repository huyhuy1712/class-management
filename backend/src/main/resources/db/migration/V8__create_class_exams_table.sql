CREATE TABLE class_exams (
    id BIGSERIAL PRIMARY KEY,

    exam_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,

    open_time TIMESTAMP,
    close_time TIMESTAMP,

    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT fk_class_exams_exam
        FOREIGN KEY (exam_id)
        REFERENCES exams(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_class_exams_class
        FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_class_exams_exam_class
        UNIQUE (exam_id, class_id),

    CONSTRAINT chk_class_exams_status
        CHECK (status IN ('DRAFT', 'PUBLISHED', 'CLOSED')),

    CONSTRAINT chk_class_exams_time
        CHECK (
            open_time IS NULL
            OR close_time IS NULL
            OR close_time > open_time
        )
);