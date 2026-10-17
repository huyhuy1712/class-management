package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.auth.LoginRequest;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.repository.ImpersonationSessionRepository;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.security.JwtService;
import com.classmanagement.backend.service.StorageService;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.lang.reflect.Proxy;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AuthServiceImplTest {

    @Test
    void loginIsBlockedWhileAnAdminImpersonationSessionIsActive() {
        AuthServiceImpl service = service(true);
        LoginRequest request = loginRequest();

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> service.login(request));

        assertEquals(
                "Quản trị viên đang truy cập tài khoản của bạn. Vui lòng thử lại sau khi phiên truy cập kết thúc.",
                exception.getMessage());
    }

    @Test
    void loginIsAllowedWhenNoActiveImpersonationSessionExists() {
        LoginRequest responseRequest = loginRequest();

        assertNotNull(service(false).login(responseRequest).getAccessToken());
    }

    @Test
    void loginShowsBlockedAccountMessageWhenAccountIsBanned() {
        AuthServiceImpl service = service(false, UserStatus.BANNED);

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> service.login(loginRequest()));

        assertEquals(
                "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để được mở lại.",
                exception.getMessage());
    }

    private static AuthServiceImpl service(boolean activeImpersonation) {
        return service(activeImpersonation, UserStatus.ACTIVE);
    }

    private static AuthServiceImpl service(boolean activeImpersonation, UserStatus status) {
        User user = User.builder()
                .id(12L)
                .username("student")
                .passwordHash("encoded-password")
                .email("student@example.com")
                .fullName("Student User")
                .role(UserRole.STUDENT)
                .status(status)
                .build();

        UserRepository users = proxy(UserRepository.class, (method, args) -> {
            if ("findByUsername".equals(method)) {
                return Optional.of(user);
            }
            throw new UnsupportedOperationException(method);
        });
        ImpersonationSessionRepository sessions = proxy(
                ImpersonationSessionRepository.class,
                (method, args) -> {
                    if ("existsByTargetUserIdAndEndedAtIsNullAndExpiresAtAfter".equals(method)) {
                        assertEquals(12L, args[0]);
                        assertNotNull(args[1]);
                        return activeImpersonation;
                    }
                    throw new UnsupportedOperationException(method);
                });
        PasswordEncoder passwordEncoder = proxy(
                PasswordEncoder.class,
                (method, args) -> "matches".equals(method));
        JwtService jwtService = new JwtService();
        setField(jwtService, "jwtSecret", Base64.getEncoder().encodeToString(
                "class-management-test-jwt-secret".getBytes(StandardCharsets.UTF_8)));
        setField(jwtService, "jwtExpiration", 60_000L);

        return new AuthServiceImpl(
                users,
                sessions,
                passwordEncoder,
                jwtService,
                proxy(StorageService.class, (method, args) -> null));
    }

    private static LoginRequest loginRequest() {
        LoginRequest request = new LoginRequest();
        request.setUsername("student");
        request.setPassword("password");
        return request;
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
