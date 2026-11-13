ALTER TABLE missions
    DROP CONSTRAINT IF EXISTS missions_status_check;

UPDATE missions
SET status = 'INACTIVE',
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'DRAFT';

ALTER TABLE missions
    ADD CONSTRAINT missions_status_check
        CHECK (status IN ('ACTIVE', 'INACTIVE'));
