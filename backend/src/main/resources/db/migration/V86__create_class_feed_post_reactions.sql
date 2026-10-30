CREATE TABLE class_feed_post_reactions (
    post_id BIGINT NOT NULL REFERENCES class_feed_posts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_kind VARCHAR(8) NOT NULL,
    reaction_code VARCHAR(32) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_class_feed_post_reactions
        PRIMARY KEY (post_id, user_id, reaction_kind),
    CONSTRAINT chk_class_feed_post_reactions_kind
        CHECK (reaction_kind IN ('VOTE', 'EMOJI')),
    CONSTRAINT chk_class_feed_post_reactions_code_format
        CHECK (reaction_code ~ '^[A-Za-z0-9_-]{1,32}$'),
    CONSTRAINT chk_class_feed_post_reactions_code_kind
        CHECK (
            (reaction_kind = 'VOTE' AND reaction_code IN ('LIKE', 'DISLIKE'))
            OR (reaction_kind = 'EMOJI' AND reaction_code NOT IN ('LIKE', 'DISLIKE'))
        )
);

CREATE INDEX idx_class_feed_post_reactions_post_summary
    ON class_feed_post_reactions (post_id, reaction_kind, reaction_code);

CREATE INDEX idx_class_feed_post_reactions_user
    ON class_feed_post_reactions (user_id, post_id);
