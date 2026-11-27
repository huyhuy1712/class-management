package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.user.AdminDashboardResponse;
import com.classmanagement.backend.dto.user.AdminUserRequest;
import com.classmanagement.backend.dto.user.AdminVipRequest;
import com.classmanagement.backend.dto.user.UserResponse;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.service.AdminActivityService;
import com.classmanagement.backend.service.AdminUserService;
import com.classmanagement.backend.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final AdminUserService adminUserService;
    private final AdminActivityService adminActivityService;

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
            @Valid @RequestBody AdminUserRequest request,
            Authentication authentication) {
        UserResponse user = adminUserService.updateUser(userId, request);
        adminActivityService.recordByUsername(
                authentication.getName(), "UPDATE", "ACCOUNT", userId,
                "Cập nhật tài khoản: " + accountLabel(user)
                        + " · vai trò " + roleLabel(user.getRole())
                        + " · trạng thái " + statusLabel(user.getStatus()));
        return ResponseEntity.ok(user);
    }

    @PatchMapping("/users/{userId}/approve")
    public ResponseEntity<UserResponse> approveUser(
            @PathVariable Long userId,
            Authentication authentication) {
        UserResponse user = adminUserService.approveUser(userId);
        adminActivityService.recordByUsername(authentication.getName(), "APPROVE", "ACCOUNT", userId,
                "Duyệt tài khoản: " + accountLabel(user));
        return ResponseEntity.ok(user);
    }

    @PatchMapping("/users/{userId}/block")
    public ResponseEntity<UserResponse> blockUser(
            @PathVariable Long userId,
            Authentication authentication) {
        UserResponse user = adminUserService.setBlocked(userId, true);
        adminActivityService.recordByUsername(authentication.getName(), "BLOCK", "ACCOUNT", userId,
                "Khóa tài khoản: " + accountLabel(user));
        return ResponseEntity.ok(user);
    }

    @PatchMapping("/users/{userId}/unblock")
    public ResponseEntity<UserResponse> unblockUser(
            @PathVariable Long userId,
            Authentication authentication) {
        UserResponse user = adminUserService.setBlocked(userId, false);
        adminActivityService.recordByUsername(authentication.getName(), "UNBLOCK", "ACCOUNT", userId,
                "Mở khóa tài khoản: " + accountLabel(user));
        return ResponseEntity.ok(user);
    }

    @PutMapping("/users/{userId}/vip")
    public ResponseEntity<Void> grantVip(
            @PathVariable Long userId,
            @Valid @RequestBody AdminVipRequest request,
            Authentication authentication) {
        User target = userRepository.findById(userId).orElse(null);
        adminUserService.grantVip(userId, request);
        adminActivityService.recordByUsername(authentication.getName(), "GRANT_VIP", "ACCOUNT", userId,
                "Cấp gói VIP cho tài khoản: " + accountLabel(target, userId)
                        + " · hạng " + request.vipTier()
                        + (request.permanent() ? " · vĩnh viễn" : " · " + request.durationMonths() + " tháng"));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/users/{userId}/vip")
    public ResponseEntity<Void> removeVip(
            @PathVariable Long userId,
            Authentication authentication) {
        User target = userRepository.findById(userId).orElse(null);
        adminUserService.removeVip(userId);
        adminActivityService.recordByUsername(authentication.getName(), "REMOVE_VIP", "ACCOUNT", userId,
                "Gỡ gói VIP của tài khoản: " + accountLabel(target, userId));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long userId,
            Authentication authentication) {
        User target = userRepository.findById(userId).orElse(null);
        try {
            adminUserService.deleteUser(userId);
            adminActivityService.recordByUsername(authentication.getName(), "DELETE", "ACCOUNT", userId,
                    "Xóa tài khoản: " + accountLabel(target, userId));
            return ResponseEntity.noContent().build();
        } catch (DataIntegrityViolationException exception) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(java.util.Map.of(
                            "message",
                            "Không thể xóa tài khoản vì đang được sử dụng trong dữ liệu lớp học hoặc bài kiểm tra."));
        }
    }

    private String accountLabel(UserResponse user) {
        return accountLabel(user.getFullName(), user.getUsername());
    }

    private String roleLabel(UserRole role) {
        return role == UserRole.TEACHER ? "giáo viên" : "học sinh";
    }

    private String statusLabel(UserStatus status) {
        return switch (status) {
            case ACTIVE -> "đang hoạt động";
            case INACTIVE -> "đã vô hiệu hóa";
            case PENDING -> "chờ duyệt";
            case BANNED -> "đã khóa";
        };
    }

    private String accountLabel(User user, Long userId) {
        return user == null
                ? "tài khoản #" + userId
                : accountLabel(user.getFullName(), user.getUsername());
    }

    private String accountLabel(String fullName, String username) {
        return fullName + " (@" + username + ")";
    }
}
