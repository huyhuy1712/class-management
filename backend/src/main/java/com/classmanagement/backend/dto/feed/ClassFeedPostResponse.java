package com.classmanagement.backend.dto.feed;

import com.classmanagement.backend.entity.enums.UserRole;

import java.time.LocalDateTime;

public record ClassFeedPostResponse(
        Long id,
        Long classId,
        Long authorId,
        String authorName,
        String authorAvatar,
        UserRole authorRole,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
