package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.auth.SignupRequest;
import com.classmanagement.backend.dto.auth.SignupResponse;
import com.classmanagement.backend.dto.auth.LoginRequest;
import com.classmanagement.backend.dto.auth.LoginResponse;
import com.classmanagement.backend.dto.auth.EmailVerificationRequest;
import com.classmanagement.backend.dto.auth.ResendEmailVerificationRequest;
import com.classmanagement.backend.dto.auth.UpdatePendingSignupRequest;
import com.classmanagement.backend.dto.auth.PasswordResetRequest;
import com.classmanagement.backend.dto.auth.VerifyPasswordResetCodeRequest;
import com.classmanagement.backend.dto.auth.CompletePasswordResetRequest;

import java.util.Map;

public interface AuthService {

    SignupResponse signup(SignupRequest request);
    LoginResponse login(LoginRequest request);
    LoginResponse getCurrentUser(String username);
    SignupResponse verifyEmail(EmailVerificationRequest request);
    void resendEmailVerificationCode(ResendEmailVerificationRequest request);
    SignupResponse updatePendingSignup(UpdatePendingSignupRequest request);
    void requestPasswordReset(PasswordResetRequest request);
    String verifyPasswordResetCode(VerifyPasswordResetCodeRequest request);
    void completePasswordReset(CompletePasswordResetRequest request);
    Map<String, String> getPasswordRecoveryContact();

}