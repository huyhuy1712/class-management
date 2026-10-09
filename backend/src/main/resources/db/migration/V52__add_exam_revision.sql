ALTER TABLE exams ADD COLUMN revision BIGINT NOT NULL DEFAULT 0;
ALTER TABLE exams ADD CONSTRAINT chk_exams_revision CHECK (revision >= 0);
