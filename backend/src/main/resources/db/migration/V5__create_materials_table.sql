CREATE TABLE materials (
    id BIGSERIAL PRIMARY KEY,

    class_id BIGINT NOT NULL,

    type VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    file_url VARCHAR(500),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_materials_class
        FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_materials_type
        CHECK (type IN ('ANNOUNCEMENT', 'DOCUMENT'))
);