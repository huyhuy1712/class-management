ALTER TABLE exam_assignments
    ADD COLUMN score_visibility VARCHAR(30) NOT NULL DEFAULT 'NEVER',
    ADD COLUMN answer_visibility VARCHAR(30) NOT NULL DEFAULT 'NEVER',
    ADD COLUMN answer_visibility_score DECIMAL(6,2),
    ADD COLUMN hide_correct_answer_on_wrong BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE exam_assignments
    ADD CONSTRAINT chk_exam_assignments_score_visibility
        CHECK (
            score_visibility IN (
                'NEVER',
                'AFTER_SUBMIT',
                'AFTER_CLOSE'
            )
        ),
    ADD CONSTRAINT chk_exam_assignments_answer_visibility
        CHECK (
            answer_visibility IN (
                'NEVER',
                'AFTER_SUBMIT',
                'AFTER_CLOSE',
                'AFTER_SCORE'
            )
        ),
    ADD CONSTRAINT chk_exam_assignments_answer_visibility_score
        CHECK (
            answer_visibility_score IS NULL
            OR answer_visibility_score >= 0
        );