package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.auth.LoginRequest;
import com.classmanagement.backend.dto.auth.LoginResponse;
import com.classmanagement.backend.dto.auth.EmailVerificationRequest;
import com.classmanagement.backend.dto.auth.ResendEmailVerificationRequest;
import com.classmanagement.backend.dto.auth.UpdatePendingSignupRequest;
import com.classmanagement.backend.dto.auth.SignupRequest;
import com.classmanagement.backend.dto.auth.SignupResponse;
import com.classmanagement.backend.dto.auth.PasswordResetRequest;
import com.classmanagement.backend.dto.auth.PasswordResetVerificationResponse;
import com.classmanagement.backend.dto.auth.VerifyPasswordResetCodeRequest;
import com.classmanagement.backend.dto.auth.CompletePasswordResetRequest;
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
import java.util.Map;

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

    @PostMapping("/verify-email")
    public ResponseEntity<SignupResponse> verifyEmail(
            @Valid @RequestBody EmailVerificationRequest request) {
        return ResponseEntity.ok(authService.verifyEmail(request));
    }

    @PostMapping("/resend-verification-code")
    public ResponseEntity<Map<String, String>> resendVerificationCode(
            @Valid @RequestBody ResendEmailVerificationRequest request) {
        authService.resendEmailVerificationCode(request);
        return ResponseEntity.ok(Map.of(
                "message",
                "Nếu email chưa được xác nhận và đủ thời gian gửi lại, mã xác nhận sẽ được gửi."));
    }

    @PutMapping("/signup/pending")
    public ResponseEntity<SignupResponse> updatePendingSignup(
            @Valid @RequestBody UpdatePendingSignupRequest request) {
        return ResponseEntity.ok(authService.updatePendingSignup(request));
    }

    @PostMapping("/password-reset/request")
    public ResponseEntity<Map<String, String>> requestPasswordReset(
            @Valid @RequestBody PasswordResetRequest request) {
        authService.requestPasswordReset(request);
        return ResponseEntity.ok(Map.of(
                "message", "Nếu email thuộc một tài khoản hợp lệ, mã xác nhận sẽ được gửi đến email đó."));
    }

    @PostMapping("/password-reset/verify")
    public ResponseEntity<PasswordResetVerificationResponse> verifyPasswordResetCode(
            @Valid @RequestBody VerifyPasswordResetCodeRequest request) {
        return ResponseEntity.ok(new PasswordResetVerificationResponse(
                authService.verifyPasswordResetCode(request)));
    }

    @PostMapping("/password-reset/complete")
    public ResponseEntity<Map<String, String>> completePasswordReset(
            @Valid @RequestBody CompletePasswordResetRequest request) {
        authService.completePasswordReset(request);
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công. Bạn có thể đăng nhập."));
    }

    @GetMapping("/password-reset/contact")
    public ResponseEntity<Map<String, String>> getPasswordRecoveryContact() {
        return ResponseEntity.ok(authService.getPasswordRecoveryContact());
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
        return ResponseEntity.noContent()
                .header("Set-Cookie", clearAccessCookie().toString())
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

    @GetMapping("/impersonation/status")
    public ResponseEntity<Boolean> impersonationStatus(Authentication authentication) {
        boolean displaced = impersonationService.wasUserSessionDisplaced(authentication);
        ResponseEntity.BodyBuilder response = ResponseEntity.ok();
        if (displaced) {
            response.header("Set-Cookie", clearAccessCookie().toString());
        }
        return response.body(displaced);
    }

    private ResponseCookie clearAccessCookie() {
        return ResponseCookie.from("access_token", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(Duration.ZERO)
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