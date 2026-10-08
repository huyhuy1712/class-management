ALTER TABLE answers DROP CONSTRAINT chk_answers_type;

UPDATE answers SET answer_type = 'CHOICE'
WHERE answer_type IN ('SINGLE_CHOICE', 'MULTIPLE_CHOICE');

ALTER TABLE answers ADD CONSTRAINT chk_answers_type
CHECK (answer_type IN ('CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'FILL_BLANK', 'ESSAY'));
