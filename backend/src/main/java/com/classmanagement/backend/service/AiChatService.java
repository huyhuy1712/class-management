package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.ai.AiChatRequest;
import com.classmanagement.backend.dto.ai.AiChatResponse;
import org.springframework.security.core.Authentication;

public interface AiChatService {

    AiChatResponse chat(AiChatRequest request, String clientIp, Authentication authentication);

    AiChatResponse getQuotaStatus(String clientSessionId, String clientIp, Authentication authentication);

    void resetGuestQuotaForTesting(String guestKey);
}

