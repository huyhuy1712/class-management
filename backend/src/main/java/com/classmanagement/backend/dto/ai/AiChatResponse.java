package com.classmanagement.backend.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatResponse {

    private String reply;

    /**
     * Null nếu người dùng đã đăng nhập (không giới hạn lượt chat).
     * Số nguyên >= 0 biểu thị số lượt hỏi thử còn lại của khách.
     */
    private Integer remainingQuota;

    /**
     * True nếu đã hết lượt dùng thử của khách.
     */
    private boolean limitReached;

    /**
     * Vai trò nhận diện: "STUDENT", "TEACHER", "GUEST", hoặc "ADMIN".
     */
    private String role;
}

