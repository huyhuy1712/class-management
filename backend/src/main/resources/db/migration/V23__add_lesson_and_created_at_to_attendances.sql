ALTER TABLE attendances
ADD COLUMN lesson_id BIGINT;

ALTER TABLE attendances
ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE attendances
ADD CONSTRAINT fk_attendances_lesson
FOREIGN KEY (lesson_id)
REFERENCES lessons(id);

CREATE INDEX idx_attendances_lesson_id
ON attendances(lesson_id);