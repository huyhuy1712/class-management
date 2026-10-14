ALTER TABLE exams ADD COLUMN copied_from_exam_id BIGINT;
ALTER TABLE exams ADD COLUMN copy_request_id UUID;
CREATE UNIQUE INDEX uq_exam_copy_request ON exams (teacher_id, copied_from_exam_id, copy_request_id)
    WHERE copy_request_id IS NOT NULL;
