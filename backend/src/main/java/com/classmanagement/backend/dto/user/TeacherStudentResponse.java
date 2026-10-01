package com.classmanagement.backend.dto.user;

import java.util.List;

import com.classmanagement.backend.entity.enums.ClassroomStatus;
import com.classmanagement.backend.entity.enums.UserStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TeacherStudentResponse {

    private Long id;

    private String username;

    private String email;

    private String fullName;

    private String phone;

    private String avatar;

    private String studentCode;

    private UserStatus status;

    private List<StudentClassResponse> classes;
}