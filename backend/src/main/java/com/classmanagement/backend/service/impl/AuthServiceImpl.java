package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.auth.LoginRequest;
import com.classmanagement.backend.dto.auth.LoginResponse;
import com.classmanagement.backend.dto.auth.SignupRequest;
import com.classmanagement.backend.dto.auth.SignupResponse;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.security.CustomUserDetailsService;
import com.classmanagement.backend.security.JwtService;
import com.classmanagement.backend.service.AuthService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.security.core.AuthenticationException;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;


    // =========================
    // SIGNUP
    // =========================

    @Override
    public SignupResponse signup(SignupRequest request) {

        // 1. Không cho phép signup ADMIN
        if (request.getRole() == UserRole.ADMIN) {
            throw new IllegalArgumentException(
                    "Admin account cannot be registered"
            );
        }

        // 2. Check username
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException(
                    "Username already exists"
            );
        }

        // 3. Check email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException(
                    "Email already exists"
            );
        }

        // 4. Check phone nếu user có nhập
        if (request.getPhone() != null
                && !request.getPhone().isBlank()
                && userRepository.existsByPhone(request.getPhone())) {

            throw new IllegalArgumentException(
                    "Phone already exists"
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
                    "Invalid registration role"
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

        // 8. Entity -> Response DTO
        return SignupResponse.builder()
                .id(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .fullName(savedUser.getFullName())
                .phone(savedUser.getPhone())
                .avatar(savedUser.getAvatar())
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
                            "Invalid username or password"
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

    // 3. Cho Spring Security authenticate
    try {

        System.out.println("BEFORE AUTHENTICATION");

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        System.out.println("AUTHENTICATION SUCCESS");

    } catch (Exception ex) {

        System.out.println("===== AUTHENTICATION ERROR =====");
        System.out.println("TYPE: " + ex.getClass().getName());
        System.out.println("MESSAGE: " + ex.getMessage());

        ex.printStackTrace();

        throw ex;
    }

    // 4. Check status
    if (user.getStatus() == UserStatus.PENDING) {
        throw new IllegalStateException(
                "Your account is waiting for admin approval"
        );
    }

    if (user.getStatus() == UserStatus.BANNED) {
        throw new IllegalStateException(
                "Your account has been banned"
        );
    }

    // 5. Load UserDetails
    UserDetails userDetails =
            userDetailsService.loadUserByUsername(
                    user.getUsername()
            );

    System.out.println("USER DETAILS LOADED");

    // 6. Generate JWT
    String accessToken =
            jwtService.generateToken(userDetails);

    System.out.println("JWT GENERATED");
    System.out.println("===== LOGIN SUCCESS =====");

    // 7. Response
    return LoginResponse.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .phone(user.getPhone())
            .avatar(user.getAvatar())
            .role(user.getRole())
            .status(user.getStatus())
            .accessToken(accessToken)
            .tokenType("Bearer")
            .build();
}

}