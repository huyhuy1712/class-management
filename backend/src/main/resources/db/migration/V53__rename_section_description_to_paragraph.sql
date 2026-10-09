-- Rename only: preserve all existing section text, indexes and row identities.
-- Exam-level description remains unchanged.
ALTER TABLE exam_sections RENAME COLUMN description TO paragraph;
