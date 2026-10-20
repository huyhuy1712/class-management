package com.classmanagement.backend.controller;

import com.classmanagement.backend.repository.UserAuthIdentityRepository;
import com.classmanagement.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/google")
@RequiredArgsConstructor
public class GoogleOAuthController {
    private final AuthService authService;
    private final UserAuthIdentityRepository identities;

    @Value("${app.auth.google.enabled:false}")
    private boolean googleEnabled;

    @GetMapping("/enabled")
    public ResponseEntity<Map<String, Boolean>> enabled() {
        return ResponseEntity.ok(Map.of("enabled", googleEnabled));
    }

    @GetMapping("/linked")
    public ResponseEntity<Map<String, Boolean>> linked(Authentication authentication) {
        boolean linked = identities.findByUserIdAndProvider(
                authService.getCurrentUser(authentication.getName()).getId(), "GOOGLE").isPresent();
        return ResponseEntity.ok(Map.of("linked", linked));
    }

    @GetMapping("/session")
    public ResponseEntity<?> session(Authentication authentication) {
        return ResponseEntity.ok(authService.getCurrentUser(authentication.getName()));
    }
}
