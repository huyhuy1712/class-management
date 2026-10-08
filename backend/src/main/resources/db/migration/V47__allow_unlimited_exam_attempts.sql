-- Exam: 0 = unlimited. Assignment: NULL = inherit, 0 = unlimited.
ALTER TABLE exams
    DROP CONSTRAINT chk_exams_max_attempts,
    ADD CONSTRAINT chk_exams_max_attempts
        CHECK (max_attempts IS NULL OR max_attempts >= 0);

ALTER TABLE exam_assignments
    DROP CONSTRAINT chk_exam_assignments_max_attempts,
    ADD CONSTRAINT chk_exam_assignments_max_attempts
        CHECK (max_attempts IS NULL OR max_attempts >= 0);
