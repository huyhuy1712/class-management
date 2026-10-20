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
import com.classmanagement.backend.entity.EmailOutboxMessage;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.repository.ImpersonationSessionRepository;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.PendingSignupRepository;
import com.classmanagement.backend.repository.PasswordResetChallengeRepository;
import com.classmanagement.backend.repository.EmailOutboxRepository;
import com.classmanagement.backend.security.JwtService;
import com.classmanagement.backend.service.AuthService;
import com.classmanagement.backend.service.StorageService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final Logger LOGGER = Logger.getLogger(AuthServiceImpl.class.getName());
    private static final HttpClient EMAIL_HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private static final ObjectMapper EMAIL_OBJECT_MAPPER = new ObjectMapper();
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
    private final EmailOutboxRepository emailOutboxRepository;

    @Value("${app.mail.provider:smtp}")
    private String mailProvider;

    @Value("${app.mail.from:}")
    private String mailFrom;

    @Value("${app.mail.api-key:}")
    private String mailApiKey;

    @Value("${app.mail.api-secret:}")
    private String mailApiSecret;

    @Value("${app.mail.api-url:https://api.mailjet.com/v3.1/send}")
    private String mailApiUrl;

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

        sendEmail(
                pending.getEmail(),
                "Mã xác nhận tài khoản FrogH",
                """
                Xin chào %s,

                Mã xác nhận email của bạn là: %s

                Mã có hiệu lực trong 10 phút và chỉ được nhập tối đa 5 lần.
                Nếu bạn không thực hiện đăng ký, hãy bỏ qua email này.
                """.formatted(pending.getFullName(), code));
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
        sendEmail(
                user.getEmail(),
                "Mã xác nhận đặt lại mật khẩu FrogH",
                """
                Xin chào %s,

                Mã xác nhận đặt lại mật khẩu của bạn là: %s

                Mã có hiệu lực trong 10 phút và chỉ được nhập tối đa 5 lần.
                Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
                """.formatted(user.getFullName(), code));
    }

    private void sendEmail(String recipient, String subject, String text) {
        if (mailFrom == null || mailFrom.isBlank()) {
            throw new IllegalStateException("Chưa cấu hình địa chỉ gửi email (MAIL_FROM).");
        }

        if ("smtp".equalsIgnoreCase(mailProvider)) {
            emailOutboxRepository.save(EmailOutboxMessage.builder()
                    .recipient(recipient)
                    .subject(subject)
                    .body(text)
                    .status("PENDING")
                    .attemptCount(0)
                    .build());
            return;
        }

        if (!"https".equalsIgnoreCase(mailProvider)) {
            throw new IllegalStateException("MAIL_PROVIDER chỉ nhận smtp hoặc https.");
        }
        if (mailApiKey == null || mailApiKey.isBlank()) {
            throw new IllegalStateException("Chưa cấu hình MAILJET_API_KEY.");
        }
        if (mailApiSecret == null || mailApiSecret.isBlank()) {
            throw new IllegalStateException("Chưa cấu hình MAILJET_API_SECRET.");
        }

        Map<String, String> sender = parseMailFrom(mailFrom);
        String requestBody;
        try {
            Map<String, Object> message = Map.of(
                    "From", Map.of("Email", sender.get("email"), "Name", sender.getOrDefault("name", "FrogH")),
                    "To", List.of(Map.of("Email", recipient)),
                    "Subject", subject,
                    "TextPart", text);
            requestBody = EMAIL_OBJECT_MAPPER.writeValueAsString(Map.of("Messages", List.of(message)));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Không thể tạo nội dung email.", exception);
        }

        String credentials = mailApiKey + ":" + mailApiSecret;
        String authorization = Base64.getEncoder()
                .encodeToString(credentials.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        HttpRequest request = HttpRequest.newBuilder(URI.create(mailApiUrl))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "Basic " + authorization)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();
        try {
            HttpResponse<String> response = EMAIL_HTTP_CLIENT.send(
                    request,
                    HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                String requestId = response.headers()
                        .firstValue("X-MJ-Request-GUID")
                        .orElse("unavailable");
                LOGGER.warning("Mailjet rejected email request: HTTP " + response.statusCode()
                        + "; requestId=" + requestId
                        + "; details: " + mailjetErrorSummary(response.body()));
                throw new IllegalStateException(
                        "Dịch vụ email từ chối gửi thư (HTTP " + response.statusCode() + ").");
            }
            try {
                JsonNode body = EMAIL_OBJECT_MAPPER.readTree(response.body());
                JsonNode messageResult = body.path("Messages").path(0);
                String status = messageResult.path("Status").asText();
                if (!"success".equalsIgnoreCase(status)) {
                    LOGGER.warning("Mailjet did not accept the email request: status=" + status
                            + "; details: " + mailjetErrorSummary(response.body()));
                    throw new IllegalStateException("Mailjet không chấp nhận yêu cầu gửi email.");
                }
            } catch (JsonProcessingException exception) {
                throw new IllegalStateException("Không đọc được phản hồi từ Mailjet.", exception);
            }
        } catch (IOException exception) {
            LOGGER.log(Level.SEVERE, "Could not connect to the email provider API.", exception);
            throw new IllegalStateException("Không thể kết nối dịch vụ gửi email. Vui lòng thử lại sau.", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            LOGGER.log(Level.SEVERE, "Email provider request was interrupted.", exception);
            throw new IllegalStateException("Yêu cầu gửi email bị gián đoạn. Vui lòng thử lại sau.", exception);
        }
    }

    static String mailjetErrorSummary(String responseBody) {
        try {
            JsonNode body = EMAIL_OBJECT_MAPPER.readTree(responseBody);
            List<String> details = new ArrayList<>();
            appendMailjetErrorFields(body, details);
            JsonNode errors = body.path("Messages").path(0).path("Errors");
            if (errors.isArray()) {
                errors.forEach(error -> appendMailjetErrorFields(error, details));
            }
            if (details.isEmpty()) {
                return "Mailjet response did not contain standard error details";
            }
            String summary = String.join("; ", details).replaceAll("[\\r\\n\\t]", " ");
            return summary.length() <= 1000 ? summary : summary.substring(0, 1000);
        } catch (JsonProcessingException exception) {
            return "Mailjet response was not valid JSON";
        }
    }

    private static void appendMailjetErrorFields(JsonNode node, List<String> details) {
        for (String field : List.of("ErrorIdentifier", "ErrorCode", "StatusCode", "ErrorMessage", "Status")) {
            JsonNode value = node.get(field);
            if (value != null && !value.isNull() && !value.asText().isBlank()) {
                details.add(field + "=" + value.asText());
            }
        }
    }

    private Map<String, String> parseMailFrom(String from) {
        String value = from.trim();
        int nameStart = value.lastIndexOf('<');
        if (nameStart >= 0 && value.endsWith(">")) {
            String name = value.substring(0, nameStart).trim();
            String email = value.substring(nameStart + 1, value.length() - 1).trim();
            if (name.isEmpty() || email.isEmpty()) {
                throw new IllegalStateException("MAIL_FROM phải có định dạng Tên <email@domain.com> hoặc email@domain.com.");
            }
            return Map.of("name", name, "email", email);
        }
        if (value.contains("<") || value.contains(">")) {
            throw new IllegalStateException("MAIL_FROM phải có định dạng Tên <email@domain.com> hoặc email@domain.com.");
        }
        return Map.of("email", value);
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

    String loginIdentifier = request.getUsername().trim();
    User user = userRepository.findByUsername(loginIdentifier)
            .or(() -> userRepository.findByEmailIgnoreCase(loginIdentifier))
            .orElseThrow(() ->
                    new IllegalArgumentException(
                            "Tên đăng nhập hoặc email không tồn tại"
                    )
            );

    // 2. Kiểm tra trực tiếp BCrypt
    boolean passwordMatches = user.getPasswordHash() != null
            && passwordEncoder.matches(request.getPassword(), user.getPasswordHash());

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
                    .password(user.getPasswordHash() == null ? "" : user.getPasswordHash())
                    .authorities("ROLE_" + user.getRole().name())
                    .build();

    // 5. Generate JWT
    String accessToken =
            jwtService.generateToken(userDetails);

    // 6. Response
    return toLoginResponse(user, accessToken);
}

    @Override
    @Transactional(readOnly = true)
    public LoginResponse getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng."));
        return toLoginResponse(user, null);
    }

    private LoginResponse toLoginResponse(User user, String accessToken) {
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
