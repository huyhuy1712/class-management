package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.user.UserResponse;
import com.classmanagement.backend.entity.ImpersonationSession;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.repository.ImpersonationSessionRepository;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.security.ImpersonationAuthenticationDetails;
import com.classmanagement.backend.security.JwtService;
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
    private final JwtService jwtService;
    private final StorageService storageService;

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

        UserDetails targetDetails = org.springframework.security.core.userdetails.User
                .withUsername(target.getUsername())
                .password("")
                .authorities("ROLE_" + target.getRole().name())
                .build();

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
            }
        });
    }

    @Transactional
    public void endCurrentSession(Authentication authentication, String endReason) {
        if (authentication != null
                && authentication.getDetails() instanceof ImpersonationAuthenticationDetails details) {
            end(details.sessionId(), endReason);
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
