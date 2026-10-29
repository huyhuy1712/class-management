package com.classmanagement.backend.dto.feed;

import java.util.List;

public record ClassFeedCommentPageResponse(
        List<ClassFeedCommentResponse> items,
        int page,
        int size,
        long totalElements,
        int totalPages) {
}
