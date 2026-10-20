-- Remove all assignment history for exams with stale CLASS or STUDENT targets.
WITH affected_exams AS MATERIALIZED (
    SELECT DISTINCT assignment.exam_id
    FROM exam_assignments assignment
    WHERE (
        assignment.assignment_type = 'CLASS'
        AND NOT EXISTS (
            SELECT 1
            FROM exam_assignment_classes target
            WHERE target.assignment_id = assignment.id
        )
    ) OR (
        assignment.assignment_type = 'STUDENT'
        AND EXISTS (
            SELECT 1
            FROM exam_assignment_students target
            WHERE target.assignment_id = assignment.id
              AND target.class_id IS NULL
        )
    )
),
affected_assignments AS MATERIALIZED (
    SELECT assignment.id, assignment.exam_id
    FROM exam_assignments assignment
    JOIN affected_exams affected ON affected.exam_id = assignment.exam_id
),
deleted_assignments AS (
    DELETE FROM exam_assignments assignment
    USING affected_assignments affected
    WHERE assignment.id = affected.id
    RETURNING assignment.id
)
UPDATE exams exam
SET status = 'DRAFT',
    updated_at = CURRENT_TIMESTAMP,
    revision = exam.revision + 1
FROM affected_exams affected
WHERE exam.id = affected.exam_id;
