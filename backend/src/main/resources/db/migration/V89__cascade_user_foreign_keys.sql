-- Ensure every current foreign key to users removes dependent records on deletion.
-- These explicit statements avoid requiring the plpgsql extension.

ALTER TABLE classes
    DROP CONSTRAINT IF EXISTS fk_classes_teacher;
ALTER TABLE classes
    ADD CONSTRAINT fk_classes_teacher
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE requests
    DROP CONSTRAINT IF EXISTS fk_requests_sender;
ALTER TABLE requests
    ADD CONSTRAINT fk_requests_sender
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE requests
    DROP CONSTRAINT IF EXISTS fk_requests_receiver;
ALTER TABLE requests
    ADD CONSTRAINT fk_requests_receiver
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE exams
    DROP CONSTRAINT IF EXISTS fk_exams_teacher;
ALTER TABLE exams
    ADD CONSTRAINT fk_exams_teacher
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE exam_attempts
    DROP CONSTRAINT IF EXISTS fk_exam_attempts_student;
ALTER TABLE exam_attempts
    ADD CONSTRAINT fk_exam_attempts_student
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE student_answers
    DROP CONSTRAINT IF EXISTS fk_student_answers_graded_by;
ALTER TABLE student_answers
    ADD CONSTRAINT fk_student_answers_graded_by
    FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE exam_media
    DROP CONSTRAINT IF EXISTS exam_media_teacher_id_fkey;
ALTER TABLE exam_media
    ADD CONSTRAINT exam_media_teacher_id_fkey
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE billing_orders
    DROP CONSTRAINT IF EXISTS billing_orders_teacher_id_fkey;
ALTER TABLE billing_orders
    ADD CONSTRAINT billing_orders_teacher_id_fkey
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE;
