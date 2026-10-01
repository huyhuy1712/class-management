package com.classmanagement.backend.dto.auth;

import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SignupResponse {

    private Long id;
    private String username;
    private String email;
    private String fullName;
    private UserRole role;
    private String phone;
    private String avatar;
    private String studentCode;
    private String teacherCode;
    private UserStatus status;
}