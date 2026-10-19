ALTER TABLE materials
    ADD COLUMN file_name VARCHAR(255),
    ADD COLUMN file_size BIGINT,
    ADD COLUMN file_content_type VARCHAR(255);

UPDATE materials
SET file_name = regexp_replace(file_url, '^.*/', '')
WHERE type = 'DOCUMENT'
  AND file_url IS NOT NULL;

CREATE TABLE material_assignment_excluded_classes (
    assignment_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,

    CONSTRAINT pk_material_assignment_excluded_classes
        PRIMARY KEY (assignment_id, class_id),

    CONSTRAINT fk_material_assignment_excluded_classes_assignment
        FOREIGN KEY (assignment_id)
        REFERENCES material_assignments(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_material_assignment_excluded_classes_class
        FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_material_assignment_excluded_classes_class_id
    ON material_assignment_excluded_classes (class_id);
