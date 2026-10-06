ALTER TABLE exams
ADD COLUMN code VARCHAR(50) NOT NULL;

ALTER TABLE exams
ADD CONSTRAINT uq_exams_teacher_code
UNIQUE (teacher_id, code);