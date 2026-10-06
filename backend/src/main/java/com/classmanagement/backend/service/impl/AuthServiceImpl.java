package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.auth.LoginRequest;
import com.classmanagement.backend.dto.auth.LoginResponse;
import com.classmanagement.backend.dto.auth.SignupRequest;
import com.classmanagement.backend.dto.auth.SignupResponse;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.security.JwtService;
import com.classmanagement.backend.service.AuthService;
import com.classmanagement.backend.service.StorageService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final StorageService storageService;


    // =========================
    // SIGNUP
    // =========================

    @Override
        @Transactional
    public SignupResponse signup(SignupRequest request) {

        // 1. Không cho phép signup ADMIN
        if (request.getRole() == UserRole.ADMIN) {
            throw new IllegalArgumentException(
                    "Không thể đăng ký tài khoản quản trị viên"
            );
        }

        // 2. Check username
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException(
                    "Tên đăng nhập đã tồn tại"
            );
        }

        // 3. Check email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException(
                    "Email đã tồn tại"
            );
        }

        // 4. Check phone nếu user có nhập
        if (request.getPhone() != null
                && !request.getPhone().isBlank()
                && userRepository.existsByPhone(request.getPhone())) {

            throw new IllegalArgumentException(
                    "Số điện thoại đã tồn tại"
            );
        }

        // 5. Backend tự quyết định status
        UserStatus status;

        if (request.getRole() == UserRole.TEACHER) {

            // Teacher phải chờ Admin duyệt
            status = UserStatus.PENDING;

        } else if (request.getRole() == UserRole.STUDENT) {

            // Student được active ngay
            status = UserStatus.ACTIVE;

        } else {

            throw new IllegalArgumentException(
                    "Vai trò đăng ký không hợp lệ"
            );
        }

        // 6. Tạo User
        User user = User.builder()
                .username(request.getUsername())

                // Không lưu password gốc
                // Luôn encode bằng BCrypt trước khi lưu DB
                .passwordHash(
                        passwordEncoder.encode(request.getPassword())
                )

                .email(request.getEmail())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .avatar(request.getAvatar())
                .role(request.getRole())
                .status(status)
                .build();

        // 7. Save DB
        User savedUser = userRepository.save(user);

        if (savedUser.getRole() == UserRole.TEACHER) {
            savedUser.setTeacherCode(
                    "TC-" + savedUser.getId()
            );
        } else if (savedUser.getRole() == UserRole.STUDENT) {
            savedUser.setStudentCode(
                    "ST-" + savedUser.getId()
            );
        }

        savedUser = userRepository.save(savedUser);

        // 8. Entity -> Response DTO
        return SignupResponse.builder()
                .id(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .fullName(savedUser.getFullName())
                .phone(savedUser.getPhone())
                .avatar(toAvatarUrl(savedUser.getAvatar()))
                .studentCode(savedUser.getStudentCode())
                .teacherCode(savedUser.getTeacherCode())
                .role(savedUser.getRole())
                .status(savedUser.getStatus())
                .build();
    }


    // =========================
    // LOGIN
    // =========================
@Override
public LoginResponse login(LoginRequest request) {

    System.out.println("===== LOGIN START =====");
    System.out.println("USERNAME: " + request.getUsername());

    // 1. Tìm user
    User user = userRepository
            .findByUsername(request.getUsername())
            .orElseThrow(() ->
                    new IllegalArgumentException(
                            "Tên đăng nhập không tồn tại"
                    )
            );

    System.out.println("USER FOUND");
    System.out.println("ROLE: " + user.getRole());
    System.out.println("STATUS: " + user.getStatus());

    // 2. Kiểm tra trực tiếp BCrypt
    boolean passwordMatches = passwordEncoder.matches(
            request.getPassword(),
            user.getPasswordHash()
    );

    System.out.println("PASSWORD MATCH: " + passwordMatches);

        if (!passwordMatches) {
                throw new IllegalArgumentException(
                                "Mật khẩu không chính xác"
                );
        }

    // 3. Check status
    if (user.getStatus() == UserStatus.PENDING) {
        throw new IllegalStateException(
                "Tài khoản của bạn đang chờ quản trị viên phê duyệt"
        );
    }

    if (user.getStatus() == UserStatus.BANNED) {
        throw new IllegalStateException(
                "Tài khoản của bạn đã bị khóa"
        );
    }

    // 4. Build UserDetails from the already loaded user
    UserDetails userDetails =
            org.springframework.security.core.userdetails.User
                    .withUsername(user.getUsername())
                    .password(user.getPasswordHash())
                    .authorities("ROLE_" + user.getRole().name())
                    .build();

    // 5. Generate JWT
    String accessToken =
            jwtService.generateToken(userDetails);

    System.out.println("JWT GENERATED");
    System.out.println("===== LOGIN SUCCESS =====");

    // 6. Response
    return LoginResponse.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .phone(user.getPhone())
            .avatar(toAvatarUrl(user.getAvatar()))
            .studentCode(user.getStudentCode())
            .teacherCode(user.getTeacherCode())
            .role(user.getRole())
            .status(user.getStatus())
            .accessToken(accessToken)
            .tokenType("Bearer")
            .build();
}

    private String toAvatarUrl(String avatarPath) {
        if (avatarPath == null || avatarPath.isBlank()) {
            return null;
        }

        return storageService.getUrl(avatarPath);
    }

}
