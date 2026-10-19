package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.user.AdminUserRequest;
import com.classmanagement.backend.dto.user.UserResponse;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.service.StorageService;
import com.classmanagement.backend.service.MaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final StorageService storageService;
    private final MaterialService materialService;

    @Transactional(readOnly = true)
    public List<UserResponse> getUsers(UserRole role) {
        if (role == UserRole.ADMIN) {
            throw new IllegalArgumentException("Không được phép quản lý tài khoản quản trị viên");
        }

        List<User> users = role == null
                ? userRepository.findAllByRoleNot(UserRole.ADMIN)
                : userRepository.findAllByRole(role);
        return users.stream().map(this::toResponse).toList();
    }

    @Transactional
    public UserResponse createUser(AdminUserRequest request) {
        validateManageableRole(request.getRole());
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("Mật khẩu không được để trống khi tạo tài khoản");
        }

        String username = request.getUsername().trim();
        String email = request.getEmail().trim();
        String phone = normalizePhone(request.getPhone());
        ensureUniqueIdentity(username, email, phone, null);

        User user = User.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .email(email)
                .fullName(request.getFullName().trim())
                .phone(phone)
                .role(request.getRole())
                .status(request.getStatus())
                .build();

        User savedUser = userRepository.save(user);
        assignRoleCode(savedUser, request.getRole(), null);
        return toResponse(userRepository.save(savedUser));
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
                .build();
    }
}
