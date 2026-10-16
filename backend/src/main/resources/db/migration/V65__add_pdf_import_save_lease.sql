ALTER TABLE exam_import_jobs
    ADD COLUMN save_token UUID,
    ADD COLUMN save_lease_until TIMESTAMP,
    ADD COLUMN save_hash VARCHAR(64),
    ADD COLUMN saved_response TEXT CHECK (octet_length(saved_response) <= 16384);

CREATE UNIQUE INDEX uq_exam_import_draft_token ON exam_import_jobs(draft_token);
