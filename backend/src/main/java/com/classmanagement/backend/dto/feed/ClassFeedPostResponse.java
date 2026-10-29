package com.classmanagement.backend.dto.feed;

import com.classmanagement.backend.entity.enums.UserRole;

import java.time.LocalDateTime;
import java.util.List;

public record ClassFeedPostResponse(
        Long id,
        Long classId,
        Long authorId,
        String authorName,
        String authorAvatar,
        UserRole authorRole,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        long commentCount,
        long likeCount,
        long dislikeCount,
        String myVote,
        List<FeedEmojiReactionSummary> emojiReactions) {

    public ClassFeedPostResponse(
            Long id,
            Long classId,
            Long authorId,
            String authorName,
            String authorAvatar,
            UserRole authorRole,
            String content,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            long commentCount,
            long likeCount,
            long dislikeCount,
            String myVote) {
        this(id, classId, authorId, authorName, authorAvatar, authorRole, content, createdAt, updatedAt,
                commentCount, likeCount, dislikeCount, myVote, List.of());
    }
}
