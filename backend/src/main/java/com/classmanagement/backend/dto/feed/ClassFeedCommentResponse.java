package com.classmanagement.backend.dto.feed;

import com.classmanagement.backend.entity.enums.UserRole;

import java.time.LocalDateTime;
import java.util.List;

public record ClassFeedCommentResponse(
        Long id,
        Long postId,
        Long parentCommentId,
        Long authorId,
        String authorName,
        String authorAvatar,
        UserRole authorRole,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<FeedEmojiReactionSummary> emojiReactions) {

    public ClassFeedCommentResponse(
            Long id,
            Long postId,
            Long parentCommentId,
            Long authorId,
            String authorName,
            String authorAvatar,
            UserRole authorRole,
            String content,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
        this(id, postId, parentCommentId, authorId, authorName, authorAvatar, authorRole, content,
                createdAt, updatedAt, List.of());
    }
}
