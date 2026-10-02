CREATE TABLE absence_request_details (
    request_id BIGINT PRIMARY KEY,
    lesson_id BIGINT NOT NULL,

    CONSTRAINT fk_absence_request_details_request
        FOREIGN KEY (request_id)
        REFERENCES requests(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_absence_request_details_lesson
        FOREIGN KEY (lesson_id)
        REFERENCES lessons(id)
);

CREATE INDEX idx_absence_request_details_lesson
    ON absence_request_details(lesson_id);