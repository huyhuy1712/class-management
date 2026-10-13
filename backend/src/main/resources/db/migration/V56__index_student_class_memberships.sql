-- Support student-scoped assignment eligibility and class filters.
CREATE INDEX IF NOT EXISTS idx_class_students_student_class
    ON class_students (student_id, class_id);
