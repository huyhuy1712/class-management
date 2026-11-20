package com.classmanagement.backend.dto.user;

import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserResponse {

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
    private String vipTier;
    private OffsetDateTime vipExpiresAt;
    private boolean vipPermanent;
}