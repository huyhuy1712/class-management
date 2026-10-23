ALTER TABLE homework_assignments
    ADD COLUMN subject_id BIGINT REFERENCES subjects(id),
    ADD COLUMN grade_level VARCHAR(30),
    ADD COLUMN purpose VARCHAR(50);

CREATE INDEX idx_homework_assignments_subject
    ON homework_assignments(subject_id);
