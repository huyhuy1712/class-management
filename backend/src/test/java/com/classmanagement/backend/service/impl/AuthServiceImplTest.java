package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.auth.EmailVerificationRequest;
import com.classmanagement.backend.dto.auth.PasswordResetRequest;
import com.classmanagement.backend.dto.auth.VerifyPasswordResetCodeRequest;
import com.classmanagement.backend.dto.auth.CompletePasswordResetRequest;
import com.classmanagement.backend.dto.auth.LoginRequest;
import com.classmanagement.backend.dto.auth.SignupRequest;
import com.classmanagement.backend.entity.PendingSignup;
import com.classmanagement.backend.entity.PasswordResetChallenge;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.repository.ImpersonationSessionRepository;
import com.classmanagement.backend.repository.PendingSignupRepository;
import com.classmanagement.backend.repository.PasswordResetChallengeRepository;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.security.JwtService;
import com.classmanagement.backend.service.StorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.lang.reflect.Proxy;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

class AuthServiceImplTest {
    private static HttpServer emailApi;
    private static String emailApiUrl;
    private static final AtomicReference<String> LAST_EMAIL_REQUEST = new AtomicReference<>();
    private static final AtomicReference<String> LAST_EMAIL_AUTHORIZATION = new AtomicReference<>();

    @BeforeAll
    static void startEmailApiStub() throws IOException {
        emailApi = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        emailApi.createContext("/emails", exchange -> {
            LAST_EMAIL_REQUEST.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            LAST_EMAIL_AUTHORIZATION.set(exchange.getRequestHeaders().getFirst("Authorization"));
            byte[] response = "{\"Messages\":[{\"Status\":\"success\"}]}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            try (var output = exchange.getResponseBody()) {
                output.write(response);
            }
        });
        emailApi.start();
        emailApiUrl = "http://127.0.0.1:" + emailApi.getAddress().getPort() + "/emails";
    }

    @AfterAll
    static void stopEmailApiStub() {
        if (emailApi != null) emailApi.stop(0);
    }

    @Test
    void signupDoesNotCreateUserAndOnlyValidOtpCreatesOne() {
        AtomicReference<PendingSignup> pendingSignup = new AtomicReference<>();
        AtomicReference<SimpleMailMessage> sentMessage = new AtomicReference<>();
        AtomicInteger userSaveCount = new AtomicInteger();
        UserRepository users = proxy(UserRepository.class, (method, args) -> {
            if (method.startsWith("existsBy")) return false;
            if ("save".equals(method)) {
                User user = (User) args[0];
                userSaveCount.incrementAndGet();
                if (user.getId() == null) user.setId(21L);
                return user;
            }
            throw new UnsupportedOperationException(method);
        });
        PendingSignupRepository pending = proxy(PendingSignupRepository.class, (method, args) -> {
            if (method.startsWith("existsBy")) return false;
            if ("save".equals(method)) {
                PendingSignup value = (PendingSignup) args[0];
                if (value.getId() == null) value.setId(31L);
                pendingSignup.set(value);
                return value;
            }
            if ("findByEmailForUpdate".equals(method)) return Optional.ofNullable(pendingSignup.get());
            if ("delete".equals(method)) {
                pendingSignup.set(null);
                return null;
            }
            throw new UnsupportedOperationException(method);
        });
        AtomicReference<String> rawCode = new AtomicReference<>();
        PasswordEncoder encoder = proxy(PasswordEncoder.class, (method, args) -> {
            if ("encode".equals(method)) return "hashed:" + args[0];
            if ("matches".equals(method)) return ("hashed:" + args[0]).equals(args[1]);
            throw new UnsupportedOperationException(method);
        });
        JavaMailSender javaMailSender = proxy(JavaMailSender.class, (method, args) -> {
            if ("send".equals(method) && args[0] instanceof SimpleMailMessage message) {
                sentMessage.set(message);
                return null;
            }
            throw new UnsupportedOperationException(method);
        });
        AuthServiceImpl service = service(users, pending, encoder, javaMailSender);
        setField(service, "mailProvider", "smtp");

        SignupRequest request = new SignupRequest();
        request.setUsername("newstudent");
        request.setPassword("strong-password");
        request.setEmail("newstudent@gmail.com");
        request.setFullName("New Student");
        request.setRole(UserRole.STUDENT);

        service.signup(request);
        assertEquals(0, userSaveCount.get());
        assertNotNull(pendingSignup.get());
        assertEquals("newstudent@gmail.com", sentMessage.get().getTo()[0]);
        Matcher matcher = Pattern.compile("\\b(\\d{6})\\b").matcher(sentMessage.get().getText());
        assertTrue(matcher.find());
        rawCode.set(matcher.group(1));
        assertTrue(pendingSignup.get().getVerificationCodeHash().startsWith("hashed:"));

        assertThrows(IllegalArgumentException.class, () -> service.verifyEmail(
                new EmailVerificationRequest(request.getEmail(), "000000")));
        assertEquals(0, userSaveCount.get());
        assertEquals(1, pendingSignup.get().getVerificationAttempts());

        var verified = service.verifyEmail(new EmailVerificationRequest(request.getEmail(), rawCode.get()));
        assertEquals(2, userSaveCount.get());
        assertNull(pendingSignup.get());
        assertEquals("ST-21", verified.getStudentCode());
        assertEquals(UserRole.STUDENT, verified.getRole());
    }

    @Test
    void loginRemainsBlockedForTeacherAwaitingApproval() {
        User teacher = User.builder()
                .id(12L)
                .username("teacher")
                .passwordHash("hashed:password")
                .role(UserRole.TEACHER)
                .status(UserStatus.PENDING)
                .build();
        UserRepository users = proxy(UserRepository.class, (method, args) ->
                "findByUsername".equals(method) ? Optional.of(teacher) : null);
        AuthServiceImpl service = service(users,
                proxy(PendingSignupRepository.class, (method, args) -> null),
                proxy(PasswordEncoder.class, (method, args) ->
                        "matches".equals(method) && "password".equals(args[0])));
        LoginRequest request = new LoginRequest();
        request.setUsername("teacher");
        request.setPassword("password");

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> service.login(request));
        assertEquals("Tài khoản của bạn đang chờ quản trị viên phê duyệt", exception.getMessage());
    }

    @Test
    void loginSucceedsForAnExistingVerifiedUser() {
        User student = User.builder()
                .id(12L)
                .username("student")
                .passwordHash("hashed:password")
                .role(UserRole.STUDENT)
                .status(UserStatus.ACTIVE)
                .build();
        UserRepository users = proxy(UserRepository.class, (method, args) ->
                "findByUsername".equals(method) ? Optional.of(student) : null);
        AuthServiceImpl service = service(users,
                proxy(PendingSignupRepository.class, (method, args) -> null),
                proxy(PasswordEncoder.class, (method, args) ->
                        "matches".equals(method) && "password".equals(args[0])));
        LoginRequest request = new LoginRequest();
        request.setUsername("student");
        request.setPassword("password");

        assertNotNull(service.login(request).getAccessToken());
    }

    @Test
    void pendingSignupCanBeEditedWithoutCreatingAUserOrResendingOtp() {
        PendingSignup pendingValue = PendingSignup.builder()
                .id(31L)
                .username("student")
                .passwordHash("old-hash")
                .email("student@example.com")
                .fullName("Student User")
                .role(UserRole.STUDENT)
                .build();
        AtomicReference<PendingSignup> pending = new AtomicReference<>(pendingValue);
        UserRepository users = proxy(UserRepository.class, (method, args) -> {
            if (method.startsWith("existsBy")) return false;
            throw new UnsupportedOperationException(method);
        });
        PendingSignupRepository pendingRepository = proxy(PendingSignupRepository.class, (method, args) -> {
            if (method.startsWith("existsBy")) return false;
            if ("findByEmailForUpdate".equals(method)) return Optional.of(pending.get());
            if ("save".equals(method)) {
                pending.set((PendingSignup) args[0]);
                return args[0];
            }
            throw new UnsupportedOperationException(method);
        });
        PasswordEncoder encoder = proxy(PasswordEncoder.class, (method, args) -> {
            if ("matches".equals(method)) return true;
            if ("encode".equals(method)) return "new-password-hash";
            throw new UnsupportedOperationException(method);
        });
        AuthServiceImpl service = service(users, pendingRepository, encoder);
        SignupRequest updated = new SignupRequest();
        updated.setUsername("updated-student");
        updated.setPassword("new-password");
        updated.setEmail("student@example.com");
        updated.setFullName("Updated Student");
        updated.setRole(UserRole.STUDENT);

        var response = service.updatePendingSignup(new com.classmanagement.backend.dto.auth.UpdatePendingSignupRequest(
                "student@example.com", "current-password", updated));

        assertEquals("updated-student", pending.get().getUsername());
        assertEquals("new-password-hash", pending.get().getPasswordHash());
        assertEquals("Updated Student", response.getFullName());
    }

    @Test
    void passwordResetRequiresValidOtpAndConsumesItsResetToken() {
        User user = User.builder()
                .id(45L)
                .email("student@gmail.com")
                .fullName("Student")
                .passwordHash("hashed:old-password")
                .role(UserRole.STUDENT)
                .status(UserStatus.ACTIVE)
                .build();
        AtomicReference<PasswordResetChallenge> challenge = new AtomicReference<>();
        UserRepository users = proxy(UserRepository.class, (method, args) -> {
            if ("findByEmailForUpdate".equals(method)) return Optional.of(user);
            if ("save".equals(method)) return args[0];
            throw new UnsupportedOperationException(method);
        });
        PasswordResetChallengeRepository challenges = proxy(PasswordResetChallengeRepository.class, (method, args) -> {
            if ("findByUserIdForUpdate".equals(method)) return Optional.ofNullable(challenge.get());
            if ("save".equals(method)) {
                challenge.set((PasswordResetChallenge) args[0]);
                return args[0];
            }
            if ("delete".equals(method)) {
                challenge.set(null);
                return null;
            }
            throw new UnsupportedOperationException(method);
        });
        PasswordEncoder encoder = proxy(PasswordEncoder.class, (method, args) -> {
            if ("encode".equals(method)) return "hashed:" + args[0];
            if ("matches".equals(method)) return ("hashed:" + args[0]).equals(args[1]);
            throw new UnsupportedOperationException(method);
        });
        AuthServiceImpl service = service(
                users,
                proxy(PendingSignupRepository.class, (method, args) -> null),
                challenges,
                encoder);

        service.requestPasswordReset(new PasswordResetRequest(user.getEmail()));
        assertTrue(LAST_EMAIL_REQUEST.get().contains("\"Email\":\"student@gmail.com\""));
        assertTrue(LAST_EMAIL_REQUEST.get().contains("\"TextPart\""));
        assertTrue(LAST_EMAIL_REQUEST.get().contains("\"Name\":\"FrogH\""));
        String expectedAuth = "Basic " + Base64.getEncoder().encodeToString(
                "test-api-key:test-api-secret".getBytes(StandardCharsets.UTF_8));
        assertEquals(expectedAuth, LAST_EMAIL_AUTHORIZATION.get());
        var matcher = Pattern.compile("\\b(\\d{6})\\b").matcher(LAST_EMAIL_REQUEST.get());
        assertTrue(matcher.find());
        String code = matcher.group(1);

        assertThrows(IllegalArgumentException.class, () -> service.verifyPasswordResetCode(
                new VerifyPasswordResetCodeRequest(user.getEmail(), "000000")));
        assertEquals(1, challenge.get().getVerificationAttempts());
        String resetToken = service.verifyPasswordResetCode(
                new VerifyPasswordResetCodeRequest(user.getEmail(), code));

        service.completePasswordReset(new CompletePasswordResetRequest(
                user.getEmail(), resetToken, "new-password", "new-password"));

        assertEquals("hashed:new-password", user.getPasswordHash());
        assertNull(challenge.get());
    }

    private static AuthServiceImpl service(
            UserRepository users,
            PendingSignupRepository pending,
            PasswordEncoder encoder) {
        return service(users, pending,
                proxy(PasswordResetChallengeRepository.class, (method, args) -> null),
                encoder);
    }

    private static AuthServiceImpl service(
            UserRepository users,
            PendingSignupRepository pending,
            PasswordEncoder encoder,
            JavaMailSender mailSender) {
        return service(users, pending,
                proxy(PasswordResetChallengeRepository.class, (method, args) -> null),
                encoder, mailSender);
    }

    private static AuthServiceImpl service(
            UserRepository users,
            PendingSignupRepository pending,
            PasswordResetChallengeRepository resetChallenges,
            PasswordEncoder encoder) {
        return service(users, pending, resetChallenges, encoder, null);
    }

    private static AuthServiceImpl service(
            UserRepository users,
            PendingSignupRepository pending,
            PasswordResetChallengeRepository resetChallenges,
            PasswordEncoder encoder,
            JavaMailSender mailSender) {
        JwtService jwtService = new JwtService();
        setField(jwtService, "jwtSecret", Base64.getEncoder().encodeToString(
                "class-management-test-jwt-secret".getBytes(StandardCharsets.UTF_8)));
        setField(jwtService, "jwtExpiration", 60_000L);
        AuthServiceImpl service = new AuthServiceImpl(
                users,
                pending,
                resetChallenges,
                proxy(ImpersonationSessionRepository.class, (method, args) -> false),
                encoder,
                jwtService,
                proxy(StorageService.class, (method, args) -> null),
                new ObjectMapper(),
                mailSenderProvider(mailSender));
        setField(service, "mailFrom", "FrogH <sender@example.com>");
        setField(service, "mailApiKey", "test-api-key");
        setField(service, "mailApiSecret", "test-api-secret");
        setField(service, "mailApiUrl", emailApiUrl);
        setField(service, "mailProvider", "https");
        return service;
    }

    @SuppressWarnings("unchecked")
    private static ObjectProvider<JavaMailSender> mailSenderProvider(JavaMailSender mailSender) {
        return (ObjectProvider<JavaMailSender>) proxy(ObjectProvider.class, (method, args) -> {
            if ("getIfAvailable".equals(method) || "getIfUnique".equals(method) || "getObject".equals(method)) {
                return mailSender;
            }
            return null;
        });
    }

    private static void setField(Object instance, String name, Object value) {
        try {
            var field = instance.getClass().getDeclaredField(name);
            field.setAccessible(true);
            field.set(instance, value);
        } catch (ReflectiveOperationException exception) {
            throw new AssertionError(exception);
        }
    }

    private static <T> T proxy(Class<T> type, ProxyCall call) {
        return type.cast(Proxy.newProxyInstance(
                type.getClassLoader(),
                new Class<?>[] { type },
                (proxy, method, args) -> call.invoke(method.getName(), args)));
    }

    @FunctionalInterface
    private interface ProxyCall {
        Object invoke(String method, Object[] args) throws Throwable;
    }
}
