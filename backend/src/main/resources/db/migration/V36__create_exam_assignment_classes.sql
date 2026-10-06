CREATE TABLE exam_assignment_classes (
    assignment_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,

    PRIMARY KEY (assignment_id, class_id),

    CONSTRAINT fk_exam_assignment_classes_assignment
        FOREIGN KEY (assignment_id)
        REFERENCES exam_assignments(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_exam_assignment_classes_class
        FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_exam_assignment_classes_class_id
    ON exam_assignment_classes(class_id);