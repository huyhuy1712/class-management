CREATE TABLE class_join_request_details (
    request_id BIGINT PRIMARY KEY,
    class_id BIGINT NOT NULL,

    CONSTRAINT fk_class_join_request_details_request
        FOREIGN KEY (request_id)
        REFERENCES requests(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_class_join_request_details_class
        FOREIGN KEY (class_id)
        REFERENCES classes(id)
);