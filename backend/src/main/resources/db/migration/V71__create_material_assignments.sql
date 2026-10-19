ALTER TABLE materials
    ADD COLUMN teacher_id BIGINT;

UPDATE materials material
SET teacher_id = classroom.teacher_id
FROM classes classroom
WHERE classroom.id = material.class_id;

ALTER TABLE materials
    ALTER COLUMN teacher_id SET NOT NULL,
    ALTER COLUMN class_id DROP NOT NULL,
    ADD CONSTRAINT fk_materials_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES users(id)
        ON DELETE CASCADE;

CREATE INDEX idx_materials_teacher_type_created_at
    ON materials (teacher_id, type, created_at DESC);

CREATE TABLE material_assignments (
    id BIGSERIAL PRIMARY KEY,
    material_id BIGINT NOT NULL UNIQUE,
    assignment_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_material_assignments_material
        FOREIGN KEY (material_id)
        REFERENCES materials(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_material_assignments_type
        CHECK (assignment_type IN ('ALL', 'CLASS', 'STUDENT'))
);

CREATE TABLE material_assignment_classes (
    assignment_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,

    CONSTRAINT pk_material_assignment_classes
        PRIMARY KEY (assignment_id, class_id),

    CONSTRAINT fk_material_assignment_classes_assignment
        FOREIGN KEY (assignment_id)
        REFERENCES material_assignments(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_material_assignment_classes_class
        FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_material_assignment_classes_class_id
    ON material_assignment_classes (class_id);

CREATE TABLE material_assignment_students (
    assignment_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    class_id BIGINT,

    CONSTRAINT pk_material_assignment_students
        PRIMARY KEY (assignment_id, student_id),

    CONSTRAINT fk_material_assignment_students_assignment
        FOREIGN KEY (assignment_id)
        REFERENCES material_assignments(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_material_assignment_students_student
        FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_material_assignment_students_class_context
        FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_material_assignment_students_student_id
    ON material_assignment_students (student_id);

CREATE INDEX idx_material_assignment_students_class_id
    ON material_assignment_students (class_id)
    WHERE class_id IS NOT NULL;

INSERT INTO material_assignments (
    material_id,
    assignment_type,
    created_at,
    updated_at
)
SELECT
    material.id,
    'CLASS',
    material.created_at,
    material.created_at
FROM materials material
WHERE material.type = 'DOCUMENT'
  AND material.class_id IS NOT NULL;

INSERT INTO material_assignment_classes (assignment_id, class_id)
SELECT assignment.id, material.class_id
FROM material_assignments assignment
JOIN materials material ON material.id = assignment.material_id;
