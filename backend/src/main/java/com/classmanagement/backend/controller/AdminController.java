package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.user.AdminDashboardResponse;
import com.classmanagement.backend.dto.user.AdminUserRequest;
import com.classmanagement.backend.dto.user.UserResponse;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.service.AdminUserService;
import com.classmanagement.backend.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final AdminUserService adminUserService;

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardResponse> getDashboard() {
        return ResponseEntity.ok(AdminDashboardResponse.builder()
                .totalUsers(userRepository.count())
                .studentCount(userRepository.countByRole(UserRole.STUDENT))
                .teacherCount(userRepository.countByRole(UserRole.TEACHER))
                .pendingCount(userRepository.countByStatus(UserStatus.PENDING))
                .bannedCount(userRepository.countByStatus(UserStatus.BANNED))
                .build());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getUsers(
            @RequestParam(required = false) UserRole role) {
        return ResponseEntity.ok(adminUserService.getUsers(role));
    }

    @PostMapping("/users")
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody AdminUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminUserService.createUser(request));
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long userId,
            @Valid @RequestBody AdminUserRequest request) {
        return ResponseEntity.ok(adminUserService.updateUser(userId, request));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        try {
            adminUserService.deleteUser(userId);
            return ResponseEntity.noContent().build();
        } catch (DataIntegrityViolationException exception) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(java.util.Map.of(
                            "message",
                            "Không thể xóa tài khoản vì đang được sử dụng trong dữ liệu lớp học hoặc bài kiểm tra."));
        }
    }
}
