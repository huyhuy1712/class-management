package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.auth.ImpersonationStartRequest;
import com.classmanagement.backend.dto.user.UserResponse;
import com.classmanagement.backend.service.ImpersonationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/admin/impersonation")
@RequiredArgsConstructor
public class AdminImpersonationController {

    private final ImpersonationService impersonationService;

    @Value("${app.auth.cookie-secure:true}")
    private boolean cookieSecure;

    @Value("${app.auth.cookie-same-site:None}")
    private String cookieSameSite;

    @Value("${app.impersonation.expiration:900000}")
    private long expirationMillis;

    @PostMapping("/{targetUserId}")
    public ResponseEntity<UserResponse> start(
            @PathVariable Long targetUserId,
            @Valid @RequestBody(required = false) ImpersonationStartRequest request,
            Authentication authentication) {
        String reason = request == null ? null : request.getReason();
        ImpersonationService.StartedImpersonation started =
                impersonationService.start(authentication, targetUserId, reason);
        ResponseCookie cookie = ResponseCookie.from("impersonation_token", started.token())
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(Duration.ofMillis(expirationMillis))
                .build();

        return ResponseEntity.ok()
                .header("Set-Cookie", cookie.toString())
                .body(started.targetUser());
    }
}
