CREATE TABLE class_join_requests (
    id BIGSERIAL PRIMARY KEY,

    class_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    message TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_class_join_requests_class
        FOREIGN KEY (class_id)
        REFERENCES classes(id),

    CONSTRAINT fk_class_join_requests_student
        FOREIGN KEY (student_id)
        REFERENCES users(id),

    CONSTRAINT uq_class_join_requests_class_student
        UNIQUE (class_id, student_id),

    CONSTRAINT chk_class_join_requests_status
        CHECK (status IN (
            'PENDING',
            'APPROVED',
            'REJECTED'
        ))
);