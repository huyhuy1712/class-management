package com.classmanagement.backend.config;

import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username}")
    private String adminUsername;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.full-name}")
    private String adminFullName;

    @Override
    public void run(String... args) {

        if (userRepository.existsByRole(UserRole.ADMIN)) {
            return;
        }

        if (userRepository.existsByUsername(adminUsername)) {
            throw new IllegalStateException(
                    "Cannot create admin: username already exists"
            );
        }

        if (userRepository.existsByEmail(adminEmail)) {
            throw new IllegalStateException(
                    "Cannot create admin: email already exists"
            );
        }

        User admin = User.builder()
                .username(adminUsername)
                .passwordHash(passwordEncoder.encode(adminPassword))
                .email(adminEmail)
                .fullName(adminFullName)
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .build();

        userRepository.save(admin);

        System.out.println("Initial administrator account created.");
    }
}