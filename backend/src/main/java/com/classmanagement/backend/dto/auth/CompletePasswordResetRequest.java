package com.classmanagement.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CompletePasswordResetRequest(
        @NotBlank @Email
        @Pattern(regexp = "^[a-zA-Z0-9._%+-]+@gmail\\.com$")
        String email,
        @NotBlank String resetToken,
        @NotBlank @Size(min = 8, max = 100, message = "Mật khẩu phải có từ 8 đến 100 ký tự")
        String newPassword,
        @NotBlank String confirmPassword) {
}
