ALTER TABLE exam_assignments
    DROP CONSTRAINT chk_exam_assignments_score_visibility,
    DROP CONSTRAINT chk_exam_assignments_answer_visibility;

UPDATE exam_assignments
SET score_visibility = 'AFTER_EXAM'
WHERE score_visibility = 'AFTER_CLOSE';

UPDATE exam_assignments
SET answer_visibility = 'AFTER_EXAM'
WHERE answer_visibility = 'AFTER_CLOSE';

ALTER TABLE exam_assignments
    ADD CONSTRAINT chk_exam_assignments_score_visibility
        CHECK (score_visibility IN ('NEVER', 'AFTER_SUBMIT', 'AFTER_EXAM')),
    ADD CONSTRAINT chk_exam_assignments_answer_visibility
        CHECK (answer_visibility IN ('NEVER', 'AFTER_SUBMIT', 'AFTER_EXAM', 'AFTER_SCORE'));
