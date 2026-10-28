package com.classmanagement.backend.dto.feed;

public record FeedEmojiReactionRow(
        Long targetId,
        String emojiCode,
        long count,
        long myCount) {
}
