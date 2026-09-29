package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.user.UserResponse;
import com.classmanagement.backend.entity.enums.UserRole;

import java.util.List;

public interface UserService {

    List<UserResponse> getAllUsers(UserRole role);

}