ALTER TABLE exams ALTER COLUMN max_score TYPE DECIMAL(7, 3);
ALTER TABLE exam_sections ALTER COLUMN points TYPE DECIMAL(7, 3);
ALTER TABLE questions ALTER COLUMN points TYPE DECIMAL(7, 3);
ALTER TABLE answers ALTER COLUMN points TYPE DECIMAL(7, 3);
ALTER TABLE answer_options ALTER COLUMN points TYPE DECIMAL(7, 3);
ALTER TABLE question_scoring_rules ALTER COLUMN score TYPE DECIMAL(7, 3);
ALTER TABLE exam_attempts
    ALTER COLUMN auto_score TYPE DECIMAL(7, 3),
    ALTER COLUMN manual_score TYPE DECIMAL(7, 3),
    ALTER COLUMN total_score TYPE DECIMAL(7, 3);
ALTER TABLE attempt_section_scores
    ALTER COLUMN auto_score TYPE DECIMAL(7, 3),
    ALTER COLUMN manual_score TYPE DECIMAL(7, 3),
    ALTER COLUMN total_score TYPE DECIMAL(7, 3);
ALTER TABLE student_answers
    ALTER COLUMN auto_score TYPE DECIMAL(7, 3),
    ALTER COLUMN manual_score TYPE DECIMAL(7, 3);
ALTER TABLE student_answer_values ALTER COLUMN score TYPE DECIMAL(7, 3);
