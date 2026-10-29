package com.classmanagement.backend.dto.ai;

import lombok.NoArgsConstructor;

@NoArgsConstructor
public class AiChatMessageDto extends AiChatRequest.ChatMessageItem {
    public AiChatMessageDto(String role, String content) {
        super(role, content);
    }
}
