ALTER TABLE exam_attempts ADD COLUMN teacher_blocked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE exam_attempts ADD COLUMN attempt_limit_override INTEGER CHECK (attempt_limit_override >= 0);
