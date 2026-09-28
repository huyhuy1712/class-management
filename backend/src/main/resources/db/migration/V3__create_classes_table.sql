CREATE TABLE classes (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,

    subject_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,

    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_classes_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id),

    CONSTRAINT fk_classes_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES users(id),

    CONSTRAINT chk_classes_status
        CHECK (status IN ('ACTIVE', 'ARCHIVED'))
);