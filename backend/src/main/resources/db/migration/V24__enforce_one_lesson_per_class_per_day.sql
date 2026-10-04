DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM lessons
        GROUP BY class_id, lesson_date
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Cannot enforce one lesson per class per day: duplicate class_id and lesson_date rows exist in lessons';
    END IF;
END;
$$;

DROP INDEX IF EXISTS idx_lessons_class_date;

ALTER TABLE lessons
ADD CONSTRAINT uq_lessons_class_date UNIQUE (class_id, lesson_date);
