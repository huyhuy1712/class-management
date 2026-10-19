ALTER TABLE exam_import_jobs
    DROP CONSTRAINT IF EXISTS exam_import_jobs_status_check;

ALTER TABLE exam_import_jobs
    ADD CONSTRAINT ck_exam_import_jobs_status
    CHECK (status IN
        ('QUEUED', 'PROCESSING', 'READY_FOR_REVIEW', 'FAILED', 'EXPIRED', 'CANCELLED'));
