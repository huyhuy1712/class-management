package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.user.AdminUserRequest;
import com.classmanagement.backend.dto.user.AdminVipRequest;
import com.classmanagement.backend.dto.user.UserResponse;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.entity.billing.TeacherVipSubscription;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.billing.TeacherVipSubscriptionRepository;
import com.classmanagement.backend.service.StorageService;
import com.classmanagement.backend.service.MaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.Comparator;
import java.util.Locale;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final StorageService storageService;
    private final MaterialService materialService;
    private final TeacherVipSubscriptionRepository vipSubscriptions;

    @Transactional(readOnly = true)
    public List<UserResponse> getUsers(UserRole role) {
        if (role == UserRole.ADMIN) {
            throw new IllegalArgumentException("Không được phép quản lý tài khoản quản trị viên");
        }

        List<User> users = role == null
                ? userRepository.findAllByRoleNot(UserRole.ADMIN)
                : userRepository.findAllByRole(role);
        List<Long> teacherIds = users.stream()
                .filter(user -> user.getRole() == UserRole.TEACHER)
                .map(User::getId)
                .toList();
        Map<Long, TeacherVipSubscription> activeVipByTeacher = teacherIds.isEmpty()
                ? Map.of()
                : vipSubscriptions.findActiveByTeacherIdIn(teacherIds, OffsetDateTime.now(ZoneOffset.UTC))
                        .stream()
                        .collect(Collectors.toMap(
                                TeacherVipSubscription::getTeacherId,
                                Function.identity(),
                                (first, second) -> Comparator.comparingInt(TeacherVipSubscription::getDeviceLimit)
                                        .compare(first, second) >= 0 ? first : second));
        return users.stream()
                .map(user -> toResponse(user, activeVipByTeacher.get(user.getId())))
                .toList();
    }

    @Transactional
    public void grantVip(Long userId, AdminVipRequest request) {
        User user = findTeacher(userId);
        String tier = request.vipTier().trim().toUpperCase(Locale.ROOT);
        int deviceLimit = switch (tier) {
            case "PERSONAL" -> 1;
            case "FIVE_DEVICES" -> 5;
            case "TEN_DEVICES" -> 10;
            default -> throw new IllegalArgumentException("Hạng VIP không hợp lệ");
        };
        if (!request.permanent()
                && (request.durationMonths() == null || request.durationMonths() < 1
                        || request.durationMonths() > 1200)) {
            throw new IllegalArgumentException("Thời hạn VIP phải từ 1 đến 1200 tháng");
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        vipSubscriptions.deleteAllByTeacherIdAndVipTierNot(userId, tier);
        vipSubscriptions.createIfMissing(userId, tier, deviceLimit, now);
        TeacherVipSubscription subscription = vipSubscriptions.findLockedByTeacherAndTier(userId, tier)
                .orElseThrow(() -> new IllegalStateException("Không thể tạo quyền VIP"));
        subscription.setDeviceLimit(deviceLimit);
        subscription.setExpiresAt(request.permanent()
                ? TeacherVipSubscription.PERMANENT_EXPIRY
                : now.plusMonths(request.durationMonths()));
        subscription.setUpdatedAt(now);
        vipSubscriptions.save(subscription);
    }

    @Transactional
    public void removeVip(Long userId) {
        findTeacher(userId);
        vipSubscriptions.deleteAllByTeacherId(userId);
    }

    @Transactional
    public UserResponse updateUser(Long userId, AdminUserRequest request) {
        User user = findUser(userId);
        validateManageableRole(request.getRole());

        String username = request.getUsername().trim();
        String email = request.getEmail().trim();
        String phone = normalizePhone(request.getPhone());
        ensureUniqueIdentity(username, email, phone, userId);

        UserRole previousRole = user.getRole();
        user.setUsername(username);
        user.setFullName(request.getFullName().trim());
        user.setEmail(email);
        user.setPhone(phone);
        user.setRole(request.getRole());
        user.setStatus(request.getStatus());

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        assignRoleCode(user, request.getRole(), previousRole);
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse approveUser(Long userId) {
        User user = findUser(userId);
        if (user.getStatus() != UserStatus.PENDING) {
            throw new IllegalStateException("Chỉ có thể duyệt tài khoản đang chờ duyệt");
        }

        user.setStatus(UserStatus.ACTIVE);
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse setBlocked(Long userId, boolean blocked) {
        User user = findUser(userId);
        if (blocked) {
            user.setStatus(UserStatus.BANNED);
        } else {
            if (user.getStatus() != UserStatus.BANNED) {
                throw new IllegalStateException("Tài khoản này không bị khóa");
            }
            user.setStatus(UserStatus.ACTIVE);
        }
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = findUser(userId);
        if (user.getRole() == UserRole.STUDENT) {
            materialService.cleanupStudentAssignments(userId);
        } else if (user.getRole() == UserRole.TEACHER) {
            materialService.cleanupTeacherDocuments(userId);
        }
        userRepository.delete(user);
        userRepository.flush();
    }

    private User findUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
        if (user.getRole() == UserRole.ADMIN) {
            throw new IllegalArgumentException("Không được phép quản lý tài khoản quản trị viên");
        }
        return user;
    }

    private User findTeacher(Long userId) {
        User user = findUser(userId);
        if (user.getRole() != UserRole.TEACHER) {
            throw new IllegalArgumentException("Chỉ có thể quản lý VIP cho tài khoản giáo viên");
        }
        return user;
    }

    private void ensureUniqueIdentity(String username, String email, String phone, Long userId) {
        boolean usernameExists = userRepository.findByUsername(username)
                .filter(user -> !user.getId().equals(userId))
                .isPresent();
        if (usernameExists) {
            throw new IllegalArgumentException("Tên đăng nhập đã tồn tại");
        }

        boolean emailExists = userId == null
                ? userRepository.existsByEmail(email)
                : userRepository.existsByEmailAndIdNot(email, userId);
        if (emailExists) {
            throw new IllegalArgumentException("Email đã tồn tại");
        }

        if (phone != null) {
            boolean phoneExists = userId == null
                    ? userRepository.existsByPhone(phone)
                    : userRepository.existsByPhoneAndIdNot(phone, userId);
            if (phoneExists) {
                throw new IllegalArgumentException("Số điện thoại đã được sử dụng");
            }
        }
    }

    private String normalizePhone(String phone) {
        return phone == null || phone.isBlank() ? null : phone.trim();
    }

    private void validateManageableRole(UserRole role) {
        if (role == null || role == UserRole.ADMIN) {
            throw new IllegalArgumentException("Chỉ được tạo hoặc sửa tài khoản học sinh, giáo viên");
        }
    }

    private void assignRoleCode(User user, UserRole role, UserRole previousRole) {
        if (previousRole != null && previousRole != role) {
            user.setStudentCode(null);
            user.setTeacherCode(null);
        }

        if (role == UserRole.STUDENT && user.getStudentCode() == null) {
            user.setStudentCode("ST-" + user.getId());
        } else if (role == UserRole.TEACHER && user.getTeacherCode() == null) {
            user.setTeacherCode("TC-" + user.getId());
        }
    }

    private UserResponse toResponse(User user) {
        return toResponse(user, null);
    }

    private UserResponse toResponse(User user, TeacherVipSubscription vip) {
        String avatarUrl = user.getAvatar() == null || user.getAvatar().isBlank()
                ? null
                : storageService.getUrl(user.getAvatar());

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatar(avatarUrl)
                .studentCode(user.getStudentCode())
                .teacherCode(user.getTeacherCode())
                .role(user.getRole())
                .status(user.getStatus())
                .vipTier(vip == null ? null : vip.getVipTier())
                .vipExpiresAt(vip == null ? null : vip.getExpiresAt())
                .vipPermanent(vip != null
                        && !vip.getExpiresAt().isBefore(TeacherVipSubscription.PERMANENT_EXPIRY))
                .build();
    }
}
