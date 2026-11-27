package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.user.UserResponse;
import com.classmanagement.backend.entity.ImpersonationSession;
import com.classmanagement.backend.entity.Notification;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.entity.enums.NotificationType;
import com.classmanagement.backend.repository.NotificationRepository;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.repository.ImpersonationSessionRepository;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.security.ImpersonationAuthenticationDetails;
import com.classmanagement.backend.security.JwtService;
import com.classmanagement.backend.security.UserAuthenticationDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class ImpersonationService {

    private final UserRepository userRepository;
    private final ImpersonationSessionRepository sessionRepository;
    private final NotificationRepository notificationRepository;
    private final JwtService jwtService;
    private final StorageService storageService;
    private final AdminActivityService adminActivityService;

    @Value("${app.impersonation.expiration:900000}")
    private long expirationMillis;

    @Transactional
    public StartedImpersonation start(
            Authentication authentication,
            Long targetUserId,
            String reason) {
        User admin = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quản trị viên"));
        if (admin.getRole() != UserRole.ADMIN || admin.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("Chỉ quản trị viên đang hoạt động mới được impersonate");
        }

        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
        if (target.getStatus() != UserStatus.ACTIVE
                || (target.getRole() != UserRole.STUDENT && target.getRole() != UserRole.TEACHER)) {
            throw new IllegalArgumentException("Chỉ có thể impersonate tài khoản học sinh hoặc giáo viên đang hoạt động");
        }
        if (expirationMillis <= 0) {
            throw new IllegalStateException("Thời hạn impersonation phải lớn hơn 0");
        }

        Instant expiresAt = Instant.now().plusMillis(expirationMillis);
        ImpersonationSession session = sessionRepository.save(ImpersonationSession.builder()
                .adminUserId(admin.getId())
                .targetUserId(target.getId())
                .reason(reason == null || reason.isBlank() ? null : reason.trim())
                .expiresAt(expiresAt)
                .build());
        String normalizedReason = reason == null || reason.isBlank() ? null : reason.trim();
        notificationRepository.save(Notification.builder()
                .user(target)
                .type(NotificationType.IMPERSONATION_ACCESS)
                .title("Quản trị viên đã truy cập tài khoản")
                .message("Quản trị viên " + admin.getFullName() + " (@" + admin.getUsername()
                        + ") đã đăng nhập vào tài khoản của bạn.\nLý do: "
                        + (normalizedReason == null ? "Không cung cấp" : normalizedReason))
                .referenceType("IMPERSONATION")
                .referenceId(session.getId())
                .build());

        UserDetails targetDetails = org.springframework.security.core.userdetails.User
                .withUsername(target.getUsername())
                .password("")
                .authorities("ROLE_" + target.getRole().name())
                .build();

        adminActivityService.recordByAdminId(
                admin.getId(), "IMPERSONATION_START", "IMPERSONATION", target.getId(),
                "Bắt đầu mạo danh tài khoản: " + accountLabel(target));
        return new StartedImpersonation(
                jwtService.generateImpersonationToken(targetDetails, session.getId(), expiresAt),
                toResponse(target));
    }

    @Transactional
    public void end(Long sessionId, String endReason) {
        sessionRepository.findById(sessionId).ifPresent(session -> {
            if (session.getEndedAt() == null) {
                session.setEndedAt(Instant.now());
                session.setEndReason(endReason);
                sessionRepository.save(session);
                String targetLabel = userRepository.findById(session.getTargetUserId())
                        .map(this::accountLabel)
                        .orElse("tài khoản #" + session.getTargetUserId());
                adminActivityService.recordByAdminId(
                        session.getAdminUserId(), "IMPERSONATION_END", "IMPERSONATION",
                        session.getTargetUserId(),
                        "Kết thúc mạo danh tài khoản: " + targetLabel
                                + " · " + impersonationEndLabel(endReason));
            }
        });
    }

    private String accountLabel(User user) {
        return user.getFullName() + " (@" + user.getUsername() + ")";
    }

    private String impersonationEndLabel(String endReason) {
        return switch (endReason == null ? "" : endReason) {
            case "STOPPED" -> "kết thúc thủ công";
            case "LOGOUT" -> "đăng xuất";
            case "REAUTHENTICATED" -> "đăng nhập lại";
            default -> "phiên kết thúc";
        };
    }

    @Transactional
    public void endCurrentSession(Authentication authentication, String endReason) {
        if (authentication != null
                && authentication.getDetails() instanceof ImpersonationAuthenticationDetails details) {
            end(details.sessionId(), endReason);
        }
    }

    @Transactional(readOnly = true)
    public boolean wasUserSessionDisplaced(Authentication authentication) {
        if (authentication == null
                || !(authentication.getDetails() instanceof UserAuthenticationDetails details)) {
            return false;
        }

        return userRepository.findByUsername(authentication.getName())
                .filter(user -> user.getRole() == UserRole.STUDENT || user.getRole() == UserRole.TEACHER)
                .map(user -> sessionRepository.existsByTargetUserIdAndStartedAtAfter(
                        user.getId(),
                        details.tokenIssuedAt()))
                .orElse(false);
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

    public record StartedImpersonation(String token, UserResponse targetUser) {
    }

    @Transactional(readOnly = true)
    public User validateSession(Long sessionId, String username, String tokenRole) {
        ImpersonationSession session = sessionRepository
                .findByIdAndEndedAtIsNullAndExpiresAtAfter(sessionId, Instant.now())
                .orElseThrow(() -> new BadCredentialsException("Phiên impersonation đã kết thúc hoặc hết hạn"));

        User admin = userRepository.findById(session.getAdminUserId())
                .orElseThrow(() -> new BadCredentialsException("Tài khoản quản trị viên không còn tồn tại"));
        if (admin.getRole() != UserRole.ADMIN || admin.getStatus() != UserStatus.ACTIVE) {
            throw new BadCredentialsException("Phiên quản trị viên không còn hợp lệ");
        }

        User target = userRepository.findById(session.getTargetUserId())
                .orElseThrow(() -> new BadCredentialsException("Tài khoản được impersonate không còn tồn tại"));
        String expectedRole = "ROLE_" + target.getRole().name();
        if (target.getStatus() != UserStatus.ACTIVE
                || (target.getRole() != UserRole.STUDENT && target.getRole() != UserRole.TEACHER)
                || !target.getUsername().equals(username)
                || !expectedRole.equals(tokenRole)) {
            throw new BadCredentialsException("Phiên impersonation không còn hợp lệ");
        }
        return target;
    }
}
