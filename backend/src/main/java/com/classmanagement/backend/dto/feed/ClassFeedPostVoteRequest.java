package com.classmanagement.backend.dto.feed;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;

public record ClassFeedPostVoteRequest(
        @NotBlank(message = "Lựa chọn là bắt buộc")
        @Pattern(regexp = "LIKE|DISLIKE", message = "Lựa chọn chỉ có thể là LIKE hoặc DISLIKE")
        String vote) {
}
