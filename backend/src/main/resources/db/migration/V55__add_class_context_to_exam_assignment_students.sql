-- Optional class context for a directly assigned student.
-- Eligibility remains based on student_id; existing assignments keep NULL.
ALTER TABLE exam_assignment_students
    ADD COLUMN class_id BIGINT;

ALTER TABLE exam_assignment_students
    ADD CONSTRAINT fk_exam_assignment_students_class_context
        FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON DELETE SET NULL;

CREATE INDEX idx_exam_assignment_students_class_id
    ON exam_assignment_students(class_id)
    WHERE class_id IS NOT NULL;
