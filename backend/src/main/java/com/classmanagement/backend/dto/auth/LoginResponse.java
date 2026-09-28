package com.classmanagement.backend.dto.auth;

import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LoginResponse {

    private String accessToken;
    private String tokenType;
    
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String avatar;
    private UserRole role;
    private UserStatus status;
}