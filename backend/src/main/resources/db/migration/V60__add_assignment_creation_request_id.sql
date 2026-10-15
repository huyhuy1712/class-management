ALTER TABLE exam_assignments ADD COLUMN creation_request_id UUID;
CREATE UNIQUE INDEX uq_exam_assignment_creation_request ON exam_assignments(exam_id, creation_request_id)
WHERE creation_request_id IS NOT NULL;
