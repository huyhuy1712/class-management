-- Keep class deletion consistent with all records owned by a class.
-- Existing constraints are recreated because ON DELETE cannot be changed in place.

ALTER TABLE IF EXISTS class_students
    DROP CONSTRAINT IF EXISTS fk_class_students_class;
ALTER TABLE IF EXISTS class_students
    ADD CONSTRAINT fk_class_students_class
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS attendances
    DROP CONSTRAINT IF EXISTS fk_attendances_class;
ALTER TABLE IF EXISTS attendances
    ADD CONSTRAINT fk_attendances_class
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS attendances
    DROP CONSTRAINT IF EXISTS fk_attendances_lesson;
ALTER TABLE IF EXISTS attendances
    ADD CONSTRAINT fk_attendances_lesson
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS lessons
    DROP CONSTRAINT IF EXISTS fk_lessons_class;
ALTER TABLE IF EXISTS lessons
    ADD CONSTRAINT fk_lessons_class
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS absence_request_details
    DROP CONSTRAINT IF EXISTS fk_absence_request_details_lesson;
ALTER TABLE IF EXISTS absence_request_details
    ADD CONSTRAINT fk_absence_request_details_lesson
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS class_exams
    DROP CONSTRAINT IF EXISTS fk_class_exams_class;
ALTER TABLE IF EXISTS class_exams
    ADD CONSTRAINT fk_class_exams_class
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS materials
    DROP CONSTRAINT IF EXISTS fk_materials_class;
ALTER TABLE IF EXISTS materials
    ADD CONSTRAINT fk_materials_class
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS class_join_request_details
    DROP CONSTRAINT IF EXISTS fk_class_join_request_details_class;
ALTER TABLE IF EXISTS class_join_request_details
    ADD CONSTRAINT fk_class_join_request_details_class
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;
