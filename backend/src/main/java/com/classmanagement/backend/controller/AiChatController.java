package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.ai.AiChatRequest;
import com.classmanagement.backend.dto.ai.AiChatResponse;
import com.classmanagement.backend.service.AiChatService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/ai")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(
            @Valid @RequestBody AiChatRequest request,
            HttpServletRequest servletRequest,
            Authentication authentication) {

        String clientIp = extractClientIp(servletRequest);
        AiChatResponse response = aiChatService.chat(request, clientIp, authentication);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/quota")
    public ResponseEntity<AiChatResponse> getQuota(
            @RequestParam(name = "clientSessionId", required = false) String clientSessionId,
            HttpServletRequest servletRequest,
            Authentication authentication) {

        String clientIp = extractClientIp(servletRequest);
        AiChatResponse response = aiChatService.getQuotaStatus(clientSessionId, clientIp, authentication);
        return ResponseEntity.ok(response);
    }

    private String extractClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}

