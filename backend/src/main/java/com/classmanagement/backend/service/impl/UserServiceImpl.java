package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.user.UpdateProfileRequest;
import com.classmanagement.backend.dto.user.UserResponse;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.service.UserService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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


    @Transactional
    @Override
    public UserResponse updateMyProfile(
                    String username,
                    UpdateProfileRequest request) {
            User user = userRepository.findByUsername(username)
                            .orElseThrow(() -> new IllegalArgumentException(
                                            "Không tìm thấy người dùng"));

            if (request.getFullName() != null) {
                    String fullName = request.getFullName().trim();

                    if (fullName.length() < 2) {
                            throw new IllegalArgumentException(
                                            "Họ tên phải có ít nhất 2 ký tự");
                    }

                    user.setFullName(fullName);
            }

            if (request.getEmail() != null) {
                    String email = request.getEmail()
                                    .trim()
                                    .toLowerCase();

                    if (userRepository.existsByEmailAndIdNot(
                                    email,
                                    user.getId())) {
                            throw new IllegalArgumentException(
                                            "Email đã được sử dụng bởi tài khoản khác");
                    }

                    user.setEmail(email);
            }

            if (request.getPhone() != null) {
                    String phone = request.getPhone().trim();

                    if (phone.isEmpty()) {
                            user.setPhone(null);
                    } else {
                            if (userRepository.existsByPhoneAndIdNot(
                                            phone,
                                            user.getId())) {
                                    throw new IllegalArgumentException(
                                                    "Số điện thoại đã được sử dụng bởi tài khoản khác");
                            }

                            user.setPhone(phone);
                    }
            }

            User updatedUser = userRepository.save(user);

            return toResponse(updatedUser);
    }

@Override
@Transactional(readOnly = true)
public UserResponse getUserById(Long userId) {

    User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException(
                    "Không tìm thấy người dùng có ID: " + userId));

    return toResponse(user);
}

}