package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.user.TeacherStudentResponse;
import com.classmanagement.backend.dto.user.UpdateProfileRequest;
import com.classmanagement.backend.dto.user.UserResponse;
import com.classmanagement.backend.entity.enums.UserRole;

import java.util.List;

public interface UserService {

    List<UserResponse> getAllUsers(UserRole role);

    UserResponse updateMyProfile(
        String username,
        UpdateProfileRequest request
);

    UserResponse getUserById(Long userId);

    List<TeacherStudentResponse> getMyStudents(String username);
}