package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.auth.LoginRequest;
import com.classmanagement.backend.dto.auth.LoginResponse;
import com.classmanagement.backend.dto.auth.EmailVerificationRequest;
import com.classmanagement.backend.dto.auth.ResendEmailVerificationRequest;
import com.classmanagement.backend.dto.auth.UpdatePendingSignupRequest;
import com.classmanagement.backend.dto.auth.SignupRequest;
import com.classmanagement.backend.dto.auth.SignupResponse;
import com.classmanagement.backend.dto.auth.PasswordResetRequest;
import com.classmanagement.backend.dto.auth.VerifyPasswordResetCodeRequest;
import com.classmanagement.backend.dto.auth.CompletePasswordResetRequest;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.PendingSignup;
import com.classmanagement.backend.entity.PasswordResetChallenge;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.repository.ImpersonationSessionRepository;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.PendingSignupRepository;
import com.classmanagement.backend.repository.PasswordResetChallengeRepository;
import com.classmanagement.backend.security.JwtService;
import com.classmanagement.backend.service.AuthService;
import com.classmanagement.backend.service.StorageService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final Duration VERIFICATION_CODE_LIFETIME = Duration.ofMinutes(10);
    private static final Duration VERIFICATION_RESEND_COOLDOWN = Duration.ofSeconds(60);
    private static final int MAX_VERIFICATION_ATTEMPTS = 5;

    private final UserRepository userRepository;
    private final PendingSignupRepository pendingSignupRepository;
    private final PasswordResetChallengeRepository passwordResetChallengeRepository;
    private final ImpersonationSessionRepository impersonationSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final StorageService storageService;
    private final JavaMailSender mailSender;

    @Value("${app.mail.from:}")
    private String mailFrom;

    @Value("${app.admin.email:}")
    private String supportEmail;

    @Value("${app.support.phone:}")
    private String supportPhone;


    // =========================
    // SIGNUP
    // =========================

    @Override
    @Transactional
    public SignupResponse signup(SignupRequest request) {
        validateSignupRole(request.getRole());
        validateAvailableSignup(request, null);

        PendingSignup pending = PendingSignup.builder()
                .username(request.getUsername().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail().trim())
                .fullName(request.getFullName().trim())
                .phone(request.getPhone())
                .avatar(request.getAvatar())
                .role(request.getRole())
                .build();
        pendingSignupRepository.save(pending);
        sendVerificationCode(pending);
        return pendingSignupResponse(pending);
    }

    @Override
    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public SignupResponse verifyEmail(EmailVerificationRequest request) {
        PendingSignup pending = pendingSignupRepository.findByEmailForUpdate(request.email().trim())
                .orElseThrow(() -> new IllegalArgumentException("Email hoặc mã xác nhận không hợp lệ."));

        LocalDateTime now = LocalDateTime.now();
        if (pending.getVerificationCodeHash() == null
                || pending.getVerificationExpiresAt() == null
                || !now.isBefore(pending.getVerificationExpiresAt())
                || pending.getVerificationAttempts() >= MAX_VERIFICATION_ATTEMPTS) {
            throw new IllegalArgumentException("Mã xác nhận đã hết hạn hoặc không còn hiệu lực. Hãy gửi mã mới.");
        }

        if (!passwordEncoder.matches(request.code(), pending.getVerificationCodeHash())) {
            int attempts = pending.getVerificationAttempts() + 1;
            pending.setVerificationAttempts(attempts);
            if (attempts >= MAX_VERIFICATION_ATTEMPTS) clearVerificationCode(pending);
            pendingSignupRepository.save(pending);
            throw new IllegalArgumentException("Mã xác nhận không chính xác.");
        }

        if (userRepository.existsByUsername(pending.getUsername())
                || userRepository.existsByEmail(pending.getEmail())
                || (pending.getPhone() != null && userRepository.existsByPhone(pending.getPhone()))) {
            throw new IllegalArgumentException("Thông tin đăng ký đã được sử dụng. Hãy quay lại cập nhật thông tin.");
        }

        User user = User.builder()
                .username(pending.getUsername())
                .passwordHash(pending.getPasswordHash())
                .email(pending.getEmail())
                .fullName(pending.getFullName())
                .phone(pending.getPhone())
                .avatar(pending.getAvatar())
                .role(pending.getRole())
                .status(pending.getRole() == UserRole.TEACHER ? UserStatus.PENDING : UserStatus.ACTIVE)
                .build();
        user = userRepository.save(user);
        if (user.getRole() == UserRole.TEACHER) user.setTeacherCode("TC-" + user.getId());
        else user.setStudentCode("ST-" + user.getId());
        user = userRepository.save(user);
        pendingSignupRepository.delete(pending);
        return userSignupResponse(user);
    }

    @Override
    @Transactional
    public void resendEmailVerificationCode(ResendEmailVerificationRequest request) {
        pendingSignupRepository.findByEmailForUpdate(request.email().trim()).ifPresent(pending -> {
            LocalDateTime sentAt = pending.getVerificationSentAt();
            if (sentAt == null || !sentAt.plus(VERIFICATION_RESEND_COOLDOWN).isAfter(LocalDateTime.now())) {
                sendVerificationCode(pending);
            }
        });
    }

    @Override
    @Transactional
    public SignupResponse updatePendingSignup(UpdatePendingSignupRequest request) {
        SignupRequest signup = request.signup();
        PendingSignup pending = pendingSignupRepository.findByEmailForUpdate(request.currentEmail().trim())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đăng ký đang chờ xác nhận."));
        if (!passwordEncoder.matches(request.currentPassword(), pending.getPasswordHash())) {
            throw new IllegalArgumentException("Không thể xác minh đăng ký đang chờ cập nhật.");
        }
        if (signup.getRole() != pending.getRole()) {
            throw new IllegalArgumentException("Không thể thay đổi vai trò sau khi đăng ký.");
        }
        validateAvailableSignup(signup, pending.getId());

        boolean emailChanged = !pending.getEmail().equalsIgnoreCase(signup.getEmail().trim());
        pending.setUsername(signup.getUsername().trim());
        pending.setEmail(signup.getEmail().trim());
        pending.setFullName(signup.getFullName().trim());
        pending.setPhone(signup.getPhone());
        pending.setAvatar(signup.getAvatar());
        pending.setPasswordHash(passwordEncoder.encode(signup.getPassword()));
        pendingSignupRepository.save(pending);
        if (emailChanged) sendVerificationCode(pending);
        return pendingSignupResponse(pending);
    }

    private void validateSignupRole(UserRole role) {
        if (role != UserRole.STUDENT && role != UserRole.TEACHER) {
            throw new IllegalArgumentException("Chỉ được đăng ký tài khoản học sinh hoặc giáo viên.");
        }
    }

    private void validateAvailableSignup(SignupRequest request, Long pendingId) {
        String username = request.getUsername().trim();
        String email = request.getEmail().trim();
        String phone = request.getPhone();
        boolean usernameUsed = userRepository.existsByUsername(username)
                || (pendingId == null ? pendingSignupRepository.existsByUsername(username)
                        : pendingSignupRepository.existsByUsernameAndIdNot(username, pendingId));
        boolean emailUsed = userRepository.existsByEmail(email)
                || (pendingId == null ? pendingSignupRepository.existsByEmail(email)
                        : pendingSignupRepository.existsByEmailAndIdNot(email, pendingId));
        boolean phoneUsed = phone != null && !phone.isBlank()
                && (userRepository.existsByPhone(phone)
                        || (pendingId == null ? pendingSignupRepository.existsByPhone(phone)
                                : pendingSignupRepository.existsByPhoneAndIdNot(phone, pendingId)));
        if (usernameUsed) throw new IllegalArgumentException("Tên đăng nhập đã tồn tại");
        if (emailUsed) throw new IllegalArgumentException("Email đã tồn tại");
        if (phoneUsed) throw new IllegalArgumentException("Số điện thoại đã tồn tại");
    }

    private SignupResponse pendingSignupResponse(PendingSignup pending) {
        return SignupResponse.builder()
                .username(pending.getUsername())
                .email(pending.getEmail())
                .fullName(pending.getFullName())
                .phone(pending.getPhone())
                .avatar(toAvatarUrl(pending.getAvatar()))
                .role(pending.getRole())
                .status(pending.getRole() == UserRole.TEACHER ? UserStatus.PENDING : UserStatus.ACTIVE)
                .build();
    }

    private SignupResponse userSignupResponse(User user) {
        return SignupResponse.builder()
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
                .build();
    }

    private void sendVerificationCode(PendingSignup pending) {
        String code = String.format(Locale.ROOT, "%06d", 100_000 + SECURE_RANDOM.nextInt(900_000));
        LocalDateTime now = LocalDateTime.now();
        pending.setVerificationCodeHash(passwordEncoder.encode(code));
        pending.setVerificationExpiresAt(now.plus(VERIFICATION_CODE_LIFETIME));
        pending.setVerificationSentAt(now);
        pending.setVerificationAttempts(0);
        pendingSignupRepository.save(pending);

        SimpleMailMessage message = new SimpleMailMessage();
        if (mailFrom == null || mailFrom.isBlank()) {
            throw new IllegalStateException("Chưa cấu hình địa chỉ gửi email (MAIL_FROM).");
        }
        message.setFrom(mailFrom);
        message.setTo(pending.getEmail());
        message.setSubject("Mã xác nhận tài khoản FrogH");
        message.setText("""
                Xin chào %s,

                Mã xác nhận email của bạn là: %s

                Mã có hiệu lực trong 10 phút và chỉ được nhập tối đa 5 lần.
                Nếu bạn không thực hiện đăng ký, hãy bỏ qua email này.
                """.formatted(pending.getFullName(), code));
        mailSender.send(message);
    }

    private void clearVerificationCode(PendingSignup pending) {
        pending.setVerificationCodeHash(null);
        pending.setVerificationExpiresAt(null);
        pending.setVerificationAttempts(0);
    }

    @Override
    @Transactional
    public void requestPasswordReset(PasswordResetRequest request) {
        User user = userRepository.findByEmailForUpdate(request.email().trim()).orElse(null);
        if (user == null) return;

        LocalDateTime now = LocalDateTime.now();
        PasswordResetChallenge challenge = passwordResetChallengeRepository
                .findByUserIdForUpdate(user.getId())
                .orElseGet(() -> PasswordResetChallenge.builder().userId(user.getId()).build());
        LocalDateTime sentAt = challenge.getVerificationSentAt();
        if (sentAt != null && sentAt.plus(VERIFICATION_RESEND_COOLDOWN).isAfter(now)) return;

        String code = String.format(Locale.ROOT, "%06d", 100_000 + SECURE_RANDOM.nextInt(900_000));
        challenge.setVerificationCodeHash(passwordEncoder.encode(code));
        challenge.setVerificationExpiresAt(now.plus(VERIFICATION_CODE_LIFETIME));
        challenge.setVerificationSentAt(now);
        challenge.setVerificationAttempts(0);
        challenge.setResetTokenHash(null);
        challenge.setResetTokenExpiresAt(null);
        passwordResetChallengeRepository.save(challenge);

        if (mailFrom == null || mailFrom.isBlank()) {
            throw new IllegalStateException("Chưa cấu hình địa chỉ gửi email (MAIL_FROM).");
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(user.getEmail());
        message.setSubject("Mã xác nhận đặt lại mật khẩu FrogH");
        message.setText("""
                Xin chào %s,

                Mã xác nhận đặt lại mật khẩu của bạn là: %s

                Mã có hiệu lực trong 10 phút và chỉ được nhập tối đa 5 lần.
                Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
                """.formatted(user.getFullName(), code));
        mailSender.send(message);
    }

    @Override
    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public String verifyPasswordResetCode(VerifyPasswordResetCodeRequest request) {
        User user = userRepository.findByEmailForUpdate(request.email().trim())
                .orElseThrow(() -> new IllegalArgumentException("Email hoặc mã xác nhận không hợp lệ."));
        PasswordResetChallenge challenge = passwordResetChallengeRepository
                .findByUserIdForUpdate(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Email hoặc mã xác nhận không hợp lệ."));

        LocalDateTime now = LocalDateTime.now();
        if (challenge.getVerificationCodeHash() == null
                || challenge.getVerificationExpiresAt() == null
                || !now.isBefore(challenge.getVerificationExpiresAt())
                || challenge.getVerificationAttempts() >= MAX_VERIFICATION_ATTEMPTS) {
            throw new IllegalArgumentException("Mã xác nhận đã hết hạn hoặc không còn hiệu lực. Hãy yêu cầu mã mới.");
        }
        if (!passwordEncoder.matches(request.code(), challenge.getVerificationCodeHash())) {
            int attempts = challenge.getVerificationAttempts() + 1;
            challenge.setVerificationAttempts(attempts);
            if (attempts >= MAX_VERIFICATION_ATTEMPTS) {
                challenge.setVerificationCodeHash(null);
                challenge.setVerificationExpiresAt(null);
            }
            passwordResetChallengeRepository.save(challenge);
            throw new IllegalArgumentException("Mã xác nhận không chính xác.");
        }

        String resetToken = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(secureRandomBytes(32));
        challenge.setVerificationCodeHash(null);
        challenge.setVerificationExpiresAt(null);
        challenge.setVerificationAttempts(0);
        challenge.setResetTokenHash(passwordEncoder.encode(resetToken));
        challenge.setResetTokenExpiresAt(now.plus(VERIFICATION_CODE_LIFETIME));
        passwordResetChallengeRepository.save(challenge);
        return resetToken;
    }

    @Override
    @Transactional
    public void completePasswordReset(CompletePasswordResetRequest request) {
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new IllegalArgumentException("Mật khẩu xác nhận không khớp.");
        }
        User user = userRepository.findByEmailForUpdate(request.email().trim())
                .orElseThrow(() -> new IllegalArgumentException("Yêu cầu đặt lại mật khẩu không hợp lệ."));
        PasswordResetChallenge challenge = passwordResetChallengeRepository
                .findByUserIdForUpdate(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Yêu cầu đặt lại mật khẩu không hợp lệ."));
        if (challenge.getResetTokenHash() == null
                || challenge.getResetTokenExpiresAt() == null
                || !LocalDateTime.now().isBefore(challenge.getResetTokenExpiresAt())
                || !passwordEncoder.matches(request.resetToken(), challenge.getResetTokenHash())) {
            throw new IllegalArgumentException("Yêu cầu đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Hãy xác minh OTP lại.");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        passwordResetChallengeRepository.delete(challenge);
    }

    @Override
    public Map<String, String> getPasswordRecoveryContact() {
        Map<String, String> contact = new HashMap<>();
        if (supportEmail != null && !supportEmail.isBlank()) contact.put("email", supportEmail);
        if (supportPhone != null && !supportPhone.isBlank()) contact.put("phone", supportPhone);
        return Map.copyOf(contact);
    }

    private byte[] secureRandomBytes(int length) {
        byte[] bytes = new byte[length];
        SECURE_RANDOM.nextBytes(bytes);
        return bytes;
    }


    // =========================
    // LOGIN
    // =========================
@Override
public LoginResponse login(LoginRequest request) {

    // 1. Tìm user
    User user = userRepository
            .findByUsername(request.getUsername())
            .orElseThrow(() ->
                    new IllegalArgumentException(
                            "Tên đăng nhập không tồn tại"
                    )
            );

    // 2. Kiểm tra trực tiếp BCrypt
    boolean passwordMatches = passwordEncoder.matches(
            request.getPassword(),
            user.getPasswordHash()
    );

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
                "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để được mở lại."
        );
    }

    if ((user.getRole() == UserRole.STUDENT || user.getRole() == UserRole.TEACHER)
            && impersonationSessionRepository.existsByTargetUserIdAndEndedAtIsNullAndExpiresAtAfter(
                    user.getId(),
                    Instant.now())) {
        throw new IllegalStateException(
                "Quản trị viên đang truy cập tài khoản của bạn. Vui lòng thử lại sau khi phiên truy cập kết thúc."
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
