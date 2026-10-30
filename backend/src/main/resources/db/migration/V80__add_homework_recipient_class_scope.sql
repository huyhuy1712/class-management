CREATE TABLE homework_assignment_recipient_classes (
    assignment_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    PRIMARY KEY (assignment_id, student_id, class_id),
    CONSTRAINT fk_homework_recipient_classes_recipient
        FOREIGN KEY (assignment_id, student_id)
        REFERENCES homework_assignment_recipients(assignment_id, student_id)
        ON DELETE CASCADE
);

INSERT INTO homework_assignment_recipient_classes (assignment_id, student_id, class_id)
SELECT assignment_id, student_id, class_id
FROM homework_assignment_recipients
WHERE class_id IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE INDEX idx_homework_recipient_classes_class_assignment
    ON homework_assignment_recipient_classes(class_id, assignment_id);
