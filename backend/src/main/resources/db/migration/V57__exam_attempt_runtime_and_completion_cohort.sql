ALTER TABLE exam_attempts ADD COLUMN revision BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN start_request_id UUID, ADD COLUMN deadline_at TIMESTAMP;
CREATE INDEX idx_exam_attempts_active_deadline ON exam_attempts(deadline_at,id) WHERE status='IN_PROGRESS';
ALTER TABLE exam_attempt_events ADD COLUMN client_event_id UUID;
CREATE UNIQUE INDEX uq_attempt_client_event ON exam_attempt_events(attempt_id,client_event_id);
ALTER TABLE exam_assignments ADD COLUMN results_released_at TIMESTAMP;
CREATE TABLE exam_assignment_completion_students (
 assignment_id BIGINT NOT NULL REFERENCES exam_assignments(id) ON DELETE CASCADE,
 student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 completed_at TIMESTAMP, exempt_at TIMESTAMP, PRIMARY KEY(assignment_id,student_id)
);
-- Legacy publication rosters are unavailable: snapshot current recipients.
INSERT INTO exam_assignment_completion_students(assignment_id,student_id,completed_at)
SELECT a.id,u.id,CASE WHEN t.status IN ('SUBMITTED','GRADED') THEN COALESCE(t.submitted_at,t.updated_at) END
FROM exam_assignments a JOIN exams e ON e.id=a.exam_id CROSS JOIN users u
LEFT JOIN exam_attempts t ON t.assignment_id=a.id AND t.student_id=u.id
WHERE e.status<>'DRAFT' AND a.status<>'DRAFT' AND u.role='STUDENT' AND u.status='ACTIVE' AND (
 (a.assignment_type='STUDENT' AND EXISTS(SELECT 1 FROM exam_assignment_students s WHERE s.assignment_id=a.id AND s.student_id=u.id))
 OR (a.assignment_type='CLASS' AND EXISTS(SELECT 1 FROM exam_assignment_classes ac JOIN class_students cs ON cs.class_id=ac.class_id JOIN classes c ON c.id=cs.class_id WHERE ac.assignment_id=a.id AND cs.student_id=u.id AND c.status='ACTIVE'))
 OR (a.assignment_type='ALL' AND EXISTS(SELECT 1 FROM class_students cs JOIN classes c ON c.id=cs.class_id WHERE cs.student_id=u.id AND c.teacher_id=e.teacher_id AND c.status='ACTIVE'))
);
UPDATE exam_attempts t SET deadline_at=LEAST(t.started_at + make_interval(mins=>COALESCE(a.time_limit,e.time_limit)),a.close_time)
FROM exam_assignments a JOIN exams e ON e.id=a.exam_id
WHERE t.assignment_id=a.id AND t.status='IN_PROGRESS' AND t.started_at IS NOT NULL;
