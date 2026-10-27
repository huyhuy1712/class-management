CREATE TABLE class_feed_posts (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT chk_class_feed_posts_content_not_blank
        CHECK (length(btrim(content)) > 0),
    CONSTRAINT chk_class_feed_posts_content_length
        CHECK (length(content) <= 20000)
);

CREATE INDEX idx_class_feed_posts_class_created
    ON class_feed_posts (class_id, created_at DESC, id DESC);

CREATE INDEX idx_class_feed_posts_author
    ON class_feed_posts (author_id);
