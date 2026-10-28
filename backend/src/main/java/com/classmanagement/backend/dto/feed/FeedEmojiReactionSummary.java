package com.classmanagement.backend.dto.feed;

public record FeedEmojiReactionSummary(
        String emojiCode,
        long count,
        boolean reactedByMe) {
}
