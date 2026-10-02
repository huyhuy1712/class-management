CREATE TABLE lessons (
    id BIGSERIAL PRIMARY KEY,

    class_id BIGINT NOT NULL,

    title VARCHAR(255),

    lesson_date DATE NOT NULL,

    attendance_code VARCHAR(100) NOT NULL,

    start_time TIMESTAMP NOT NULL,
    late_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_lessons_class
        FOREIGN KEY (class_id)
        REFERENCES classes(id),

    CONSTRAINT chk_lessons_time
        CHECK (
            start_time <= late_time
            AND late_time <= end_time
        )
);

CREATE INDEX idx_lessons_class_id
    ON lessons(class_id);

CREATE INDEX idx_lessons_class_date
    ON lessons(class_id, lesson_date);