CREATE TABLE exam_assignment_students (
    assignment_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,

    PRIMARY KEY (assignment_id, student_id),

    CONSTRAINT fk_exam_assignment_students_assignment
        FOREIGN KEY (assignment_id)
        REFERENCES exam_assignments(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_exam_assignment_students_student
        FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_exam_assignment_students_student_id
    ON exam_assignment_students(student_id);