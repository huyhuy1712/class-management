CREATE TABLE exam_attempt_events (
    id BIGSERIAL PRIMARY KEY,

    attempt_id BIGINT NOT NULL,

    event_type VARCHAR(30) NOT NULL,
    event_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_exam_attempt_events_attempt
        FOREIGN KEY (attempt_id)
        REFERENCES exam_attempts(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_exam_attempt_events_type
        CHECK (
            event_type IN (
                'TAB_HIDDEN',
                'TAB_VISIBLE'
            )
        )
);

CREATE INDEX idx_exam_attempt_events_attempt_time
    ON exam_attempt_events(attempt_id, event_time);