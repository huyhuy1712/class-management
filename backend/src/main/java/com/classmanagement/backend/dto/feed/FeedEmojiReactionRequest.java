package com.classmanagement.backend.dto.feed;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record FeedEmojiReactionRequest(
        @NotBlank(message = "Mã emoji là bắt buộc")
        @Pattern(regexp = "[A-Za-z0-9_-]{1,32}", message = "Mã emoji không hợp lệ")
        String emojiCode) {
}
