CREATE TABLE teacher_activity_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(30) NOT NULL,
    resource_type VARCHAR(40) NOT NULL,
    resource_id BIGINT,
    class_id BIGINT REFERENCES classes(id) ON DELETE SET NULL,
    summary VARCHAR(300) NOT NULL,
    occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teacher_activity_actor_time
    ON teacher_activity_logs(actor_id, occurred_at DESC, id DESC);

CREATE INDEX idx_teacher_activity_class_time
    ON teacher_activity_logs(class_id, occurred_at DESC);
