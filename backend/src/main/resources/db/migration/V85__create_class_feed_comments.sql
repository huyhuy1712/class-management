CREATE TABLE class_feed_comments (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES class_feed_posts(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id BIGINT,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT uq_class_feed_comments_post_id_id UNIQUE (post_id, id),
    CONSTRAINT fk_class_feed_comments_parent
        FOREIGN KEY (post_id, parent_comment_id)
        REFERENCES class_feed_comments (post_id, id)
        ON DELETE CASCADE,
    CONSTRAINT chk_class_feed_comments_content_not_blank
        CHECK (length(btrim(content)) > 0),
    CONSTRAINT chk_class_feed_comments_content_length
        CHECK (length(content) <= 10000)
);

CREATE INDEX idx_class_feed_comments_post_created
    ON class_feed_comments (post_id, created_at, id);

CREATE INDEX idx_class_feed_comments_parent_created
    ON class_feed_comments (parent_comment_id, created_at, id);

CREATE INDEX idx_class_feed_comments_author
    ON class_feed_comments (author_id);
