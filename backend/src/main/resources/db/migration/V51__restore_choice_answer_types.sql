ALTER TABLE answers DROP CONSTRAINT chk_answers_type;
UPDATE answers a
SET answer_type = CASE
    WHEN (SELECT COUNT(*) FROM answer_options o WHERE o.answer_id = a.id AND o.is_correct = TRUE) > 1
        THEN 'MULTIPLE_CHOICE'
    ELSE 'SINGLE_CHOICE'
END
WHERE a.answer_type = 'CHOICE';
ALTER TABLE answers ADD CONSTRAINT chk_answers_type
CHECK (answer_type IN ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'FILL_BLANK', 'ESSAY'));
