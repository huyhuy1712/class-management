CREATE TABLE homework_assignments (
    id BIGSERIAL PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    instructions TEXT,
    attachment_path TEXT,
    attachment_name VARCHAR(255),
    attachment_size BIGINT,
    attachment_content_type VARCHAR(255),
    assignment_type VARCHAR(20) NOT NULL,
    due_at TIMESTAMP,
    max_score DECIMAL(7,3) NOT NULL DEFAULT 10,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_homework_assignment_type CHECK (assignment_type IN ('ALL', 'CLASS', 'STUDENT')),
    CONSTRAINT chk_homework_assignment_status CHECK (status IN ('OPEN', 'CLOSED')),
    CONSTRAINT chk_homework_assignment_score CHECK (max_score >= 0)
);

CREATE INDEX idx_homework_assignments_teacher_created
    ON homework_assignments(teacher_id, created_at DESC);

CREATE TABLE homework_assignment_classes (
    assignment_id BIGINT NOT NULL REFERENCES homework_assignments(id) ON DELETE CASCADE,
    class_id BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    PRIMARY KEY (assignment_id, class_id)
);

CREATE INDEX idx_homework_assignment_classes_class
    ON homework_assignment_classes(class_id);

CREATE TABLE homework_assignment_students (
    assignment_id BIGINT NOT NULL REFERENCES homework_assignments(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id BIGINT REFERENCES classes(id) ON DELETE SET NULL,
    PRIMARY KEY (assignment_id, student_id)
);

CREATE INDEX idx_homework_assignment_students_student
    ON homework_assignment_students(student_id);

CREATE TABLE homework_assignment_recipients (
    assignment_id BIGINT NOT NULL REFERENCES homework_assignments(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id BIGINT REFERENCES classes(id) ON DELETE SET NULL,
    PRIMARY KEY (assignment_id, student_id)
);

CREATE INDEX idx_homework_assignment_recipients_student
    ON homework_assignment_recipients(student_id, assignment_id);

CREATE TABLE homework_submissions (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL REFERENCES homework_assignments(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answer_text TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    score DECIMAL(7,3),
    teacher_comment TEXT,
    graded_at TIMESTAMP,
    resubmission_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_homework_submission_student UNIQUE (assignment_id, student_id),
    CONSTRAINT chk_homework_submission_status CHECK (status IN ('SUBMITTED', 'GRADED', 'REOPENED')),
    CONSTRAINT chk_homework_submission_score CHECK (score IS NULL OR score >= 0),
    CONSTRAINT chk_homework_submission_resubmissions CHECK (resubmission_count >= 0)
);

CREATE INDEX idx_homework_submissions_assignment_status
    ON homework_submissions(assignment_id, status);

CREATE TABLE homework_submission_images (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL REFERENCES homework_submissions(id) ON DELETE CASCADE,
    object_path TEXT NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_homework_submission_image_order UNIQUE (submission_id, order_index),
    CONSTRAINT chk_homework_submission_image_size CHECK (file_size > 0)
);

CREATE INDEX idx_homework_submission_images_submission
    ON homework_submission_images(submission_id);
