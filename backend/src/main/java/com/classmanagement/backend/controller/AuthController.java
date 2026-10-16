package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.auth.LoginRequest;
import com.classmanagement.backend.dto.auth.LoginResponse;
import com.classmanagement.backend.dto.auth.SignupRequest;
import com.classmanagement.backend.dto.auth.SignupResponse;
import com.classmanagement.backend.service.AuthService;
import com.classmanagement.backend.service.ImpersonationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final ImpersonationService impersonationService;

    @Value("${app.auth.cookie-secure:true}")
    private boolean cookieSecure;

    @Value("${app.auth.cookie-same-site:None}")
    private String cookieSameSite;

    @PostMapping("/signup")
    public ResponseEntity<SignupResponse> signup(
            @Valid @RequestBody SignupRequest request) {

        SignupResponse response = authService.signup(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            Authentication authentication) {

        LoginResponse response = authService.login(request);
        impersonationService.endCurrentSession(authentication, "REAUTHENTICATED");
        ResponseCookie cookie = ResponseCookie.from("access_token", response.getAccessToken())
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(Duration.ofDays(1))
                .build();

        return ResponseEntity.ok()
                .header("Set-Cookie", cookie.toString())
                .header("Set-Cookie", clearImpersonationCookie().toString())
                .body(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(Authentication authentication) {
        impersonationService.endCurrentSession(authentication, "LOGOUT");
        ResponseCookie accessCookie = ResponseCookie.from("access_token", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(Duration.ZERO)
                .build();

        return ResponseEntity.noContent()
                .header("Set-Cookie", accessCookie.toString())
                .header("Set-Cookie", clearImpersonationCookie().toString())
                .build();
    }

    @PostMapping("/impersonation/stop")
    public ResponseEntity<Void> stopImpersonation(Authentication authentication) {
        impersonationService.endCurrentSession(authentication, "STOPPED");
        return ResponseEntity.noContent()
                .header("Set-Cookie", clearImpersonationCookie().toString())
                .build();
    }

    private ResponseCookie clearImpersonationCookie() {
        return ResponseCookie.from("impersonation_token", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(Duration.ZERO)
                .build();
    }
}