package com.classmanagement.backend.dto.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdatePendingSignupRequest(
        @NotBlank @Email String currentEmail,
        @NotBlank String currentPassword,
        @NotNull @Valid SignupRequest signup) {}
