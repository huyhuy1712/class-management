package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.user.AdminDashboardResponse;
import com.classmanagement.backend.dto.user.AdminUserRequest;
import com.classmanagement.backend.dto.user.AdminVipRequest;
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
                .totalUsers(userRepository.countByRoleNot(UserRole.ADMIN))
                .studentCount(userRepository.countByRole(UserRole.STUDENT))
                .teacherCount(userRepository.countByRole(UserRole.TEACHER))
                .pendingCount(userRepository.countByRoleNotAndStatus(UserRole.ADMIN, UserStatus.PENDING))
                .bannedCount(userRepository.countByRoleNotAndStatus(UserRole.ADMIN, UserStatus.BANNED))
                .build());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getUsers(
            @RequestParam(required = false) UserRole role) {
        return ResponseEntity.ok(adminUserService.getUsers(role));
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long userId,
            @Valid @RequestBody AdminUserRequest request) {
        return ResponseEntity.ok(adminUserService.updateUser(userId, request));
    }

    @PatchMapping("/users/{userId}/approve")
    public ResponseEntity<UserResponse> approveUser(@PathVariable Long userId) {
        return ResponseEntity.ok(adminUserService.approveUser(userId));
    }

    @PatchMapping("/users/{userId}/block")
    public ResponseEntity<UserResponse> blockUser(@PathVariable Long userId) {
        return ResponseEntity.ok(adminUserService.setBlocked(userId, true));
    }

    @PatchMapping("/users/{userId}/unblock")
    public ResponseEntity<UserResponse> unblockUser(@PathVariable Long userId) {
        return ResponseEntity.ok(adminUserService.setBlocked(userId, false));
    }

    @PutMapping("/users/{userId}/vip")
    public ResponseEntity<Void> grantVip(
            @PathVariable Long userId,
            @Valid @RequestBody AdminVipRequest request) {
        adminUserService.grantVip(userId, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/users/{userId}/vip")
    public ResponseEntity<Void> removeVip(@PathVariable Long userId) {
        adminUserService.removeVip(userId);
        return ResponseEntity.noContent().build();
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
