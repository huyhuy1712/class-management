package com.classmanagement.backend.dto.feed;

import java.util.List;

public record ClassFeedPostPageResponse(
        List<ClassFeedPostResponse> items,
        int page,
        int size,
        long totalElements,
        int totalPages) {
}
