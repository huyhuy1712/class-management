package com.classmanagement.backend.dto.classroom;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ClassroomStudentResponse {

    private Long id;
    private String studentCode;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private String avatar;
    private LocalDateTime joinedAt;
}