CREATE TABLE attendances (
    id BIGSERIAL PRIMARY KEY,

    class_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,

    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    note TEXT,

    CONSTRAINT fk_attendances_class
        FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_attendances_student
        FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_attendances_status
        CHECK (status IN ('PRESENT', 'ABSENT', 'LATE')),

    CONSTRAINT uq_attendances_class_student_date
        UNIQUE (class_id, student_id, date)
);

CREATE INDEX idx_attendances_student_date
    ON attendances(student_id, date);