package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.user.UserResponse;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public List<UserResponse> getAllUsers(UserRole role) {

        if (role == UserRole.ADMIN) {
            throw new IllegalArgumentException(
                    "Không được phép lấy tài khoản quản trị viên");
        }
        List<User> users;

        if (role == null) {
            users = userRepository.findAllByRoleNot(UserRole.ADMIN);
        } else {
            users = userRepository.findAllByRole(role);
        }

        return users
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private UserResponse toResponse(User user) {

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatar(user.getAvatar())
                .studentCode(user.getStudentCode())
                .role(user.getRole())
                .status(user.getStatus())
                .build();
    }
}