CREATE TABLE student_answer_options (
    answer_value_id BIGINT NOT NULL,
    option_id BIGINT NOT NULL,

    PRIMARY KEY (answer_value_id, option_id),

    CONSTRAINT fk_student_answer_options_value
        FOREIGN KEY (answer_value_id)
        REFERENCES student_answer_values(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_student_answer_options_option
        FOREIGN KEY (option_id)
        REFERENCES answer_options(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_student_answer_options_option_id
    ON student_answer_options(option_id);