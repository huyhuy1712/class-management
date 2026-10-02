CREATE TABLE requests (
    id BIGSERIAL PRIMARY KEY,

    sender_id BIGINT NOT NULL,
    receiver_id BIGINT,

    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    title VARCHAR(255),
    message TEXT,
    response_message TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,

    CONSTRAINT fk_requests_sender
        FOREIGN KEY (sender_id)
        REFERENCES users(id),

    CONSTRAINT fk_requests_receiver
        FOREIGN KEY (receiver_id)
        REFERENCES users(id),

    CONSTRAINT chk_requests_status
        CHECK (
            status IN (
                'PENDING',
                'APPROVED',
                'REJECTED',
                'CANCELLED'
            )
        )
);

CREATE INDEX idx_requests_sender
    ON requests(sender_id);

CREATE INDEX idx_requests_receiver
    ON requests(receiver_id);

CREATE INDEX idx_requests_sender_status
    ON requests(sender_id, status);

CREATE INDEX idx_requests_receiver_status
    ON requests(receiver_id, status);