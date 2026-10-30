package com.classmanagement.backend.dto.feed;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClassFeedPostRequest(
        @NotBlank(message = "Nội dung bài đăng không được để trống")
        @Size(max = 20000, message = "Nội dung bài đăng không được vượt quá 20000 ký tự")
        String content) {
}
