package com.classmanagement.backend.dto.auth;

import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import lombok.Builder;
import lombok.Getter;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Getter
@Builder
public class LoginResponse {

    @JsonIgnore
    private String accessToken;
    @JsonIgnore
    private String tokenType;
    
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String avatar;
    private String studentCode;
    private String teacherCode;
    private UserRole role;
    private UserStatus status;
}