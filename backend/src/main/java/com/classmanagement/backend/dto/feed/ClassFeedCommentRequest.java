package com.classmanagement.backend.dto.feed;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClassFeedCommentRequest(
        @NotBlank(message = "Nội dung bình luận không được để trống")
        @Size(max = 10000, message = "Nội dung bình luận không được vượt quá 10000 ký tự")
        String content) {
}
