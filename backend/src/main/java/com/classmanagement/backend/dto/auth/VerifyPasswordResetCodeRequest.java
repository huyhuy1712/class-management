package com.classmanagement.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyPasswordResetCodeRequest(
        @NotBlank @Email
        @Pattern(regexp = "^[a-zA-Z0-9._%+-]+@gmail\\.com$")
        String email,
        @NotBlank @Pattern(regexp = "^\\d{6}$", message = "Mã xác nhận phải gồm 6 chữ số")
        String code) {
}
