package com.classmanagement.backend.security;

import java.time.Instant;

public record UserAuthenticationDetails(Instant tokenIssuedAt) {
}
