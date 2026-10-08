-- An Answer now represents an independently graded group. Existing child data
-- cannot be assigned to groups unambiguously: stop rather than guess or delete.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM answers)
       OR EXISTS (SELECT 1 FROM question_scoring_rules) THEN
        RAISE EXCEPTION 'V46 requires explicit conversion of existing answers/scoring rules before group-level scoring can be enabled';
    END IF;
END $$;

ALTER TABLE answers
    ADD COLUMN scoring_type VARCHAR(30) NOT NULL DEFAULT 'PER_ANSWER',
    ADD CONSTRAINT chk_answers_scoring_type
        CHECK (scoring_type IN ('PER_ANSWER', 'CORRECT_COUNT'));

ALTER TABLE question_scoring_rules
    DROP CONSTRAINT fk_question_scoring_rules_question,
    DROP CONSTRAINT uq_question_scoring_rules_count;

DROP INDEX idx_question_scoring_rules_question_id;

ALTER TABLE question_scoring_rules
    DROP COLUMN question_id,
    ADD COLUMN answer_id BIGINT NOT NULL,
    ADD CONSTRAINT fk_scoring_rules_answer
        FOREIGN KEY (answer_id) REFERENCES answers(id) ON DELETE CASCADE,
    ADD CONSTRAINT uq_answer_scoring_rules_count
        UNIQUE (answer_id, correct_count);

-- UNIQUE(answer_id, correct_count) also indexes lookups by answer_id.
ALTER TABLE questions
    DROP CONSTRAINT chk_questions_scoring_type,
    DROP COLUMN scoring_type;

ALTER TABLE answer_options
    ADD COLUMN points DECIMAL(6,2) NOT NULL DEFAULT 0,
    ADD CONSTRAINT chk_answer_options_points CHECK (points >= 0);

-- No row means unanswered. Explicit false means the student answered "False".
-- For SINGLE_CHOICE/MULTIPLE_CHOICE the selected row has boolean_value = NULL.
ALTER TABLE student_answer_options ADD COLUMN boolean_value BOOLEAN;
