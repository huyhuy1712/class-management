package com.classmanagement.backend.service;

import com.classmanagement.backend.entity.ImpersonationSession;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.repository.ImpersonationSessionRepository;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.lang.reflect.Proxy;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ImpersonationServiceTest {

    @Test
    void onlyActiveAdminsCanStartImpersonation() {
        User nonAdmin = user(1L, "teacher", UserRole.TEACHER, UserStatus.ACTIVE);
        UserRepository users = proxy(UserRepository.class, (method, args) -> {
            if ("findByUsername".equals(method)) {
                return Optional.of(nonAdmin);
            }
            throw new UnsupportedOperationException(method);
        });
        ImpersonationService service = new ImpersonationService(
                users,
                proxy(ImpersonationSessionRepository.class, (method, args) -> null),
                new JwtService(),
                proxy(StorageService.class, (method, args) -> null));

        assertThrows(IllegalArgumentException.class, () -> service.start(
                new UsernamePasswordAuthenticationToken("teacher", null, List.of()),
                2L,
                "support"));
    }

    @Test
    void inactiveTargetCannotUseImpersonationSession() {
        ImpersonationSession session = ImpersonationSession.builder()
                .id(7L)
                .adminUserId(1L)
                .targetUserId(2L)
                .expiresAt(Instant.now().plusSeconds(300))
                .build();
        User admin = user(1L, "admin", UserRole.ADMIN, UserStatus.ACTIVE);
        User target = user(2L, "student", UserRole.STUDENT, UserStatus.BANNED);

        ImpersonationSessionRepository sessions = proxy(
                ImpersonationSessionRepository.class,
                (method, args) -> Optional.of(session));
        ImpersonationService service = new ImpersonationService(
                userRepository(admin, target),
                sessions,
                new JwtService(),
                proxy(StorageService.class, (method, args) -> null));

        assertThrows(BadCredentialsException.class, () -> service.validateSession(
                7L,
                "student",
                "ROLE_STUDENT"));
    }

    @Test
    void activeTargetCanUseValidImpersonationSession() {
        ImpersonationSession session = ImpersonationSession.builder()
                .id(7L)
                .adminUserId(1L)
                .targetUserId(2L)
                .expiresAt(Instant.now().plusSeconds(300))
                .build();
        User admin = user(1L, "admin", UserRole.ADMIN, UserStatus.ACTIVE);
        User target = user(2L, "student", UserRole.STUDENT, UserStatus.ACTIVE);
        ImpersonationService service = new ImpersonationService(
                userRepository(admin, target),
                proxy(ImpersonationSessionRepository.class, (method, args) -> Optional.of(session)),
                new JwtService(),
                proxy(StorageService.class, (method, args) -> null));

        assertEquals(target, service.validateSession(7L, "student", "ROLE_STUDENT"));
    }

    @Test
    void expiredOrEndedSessionCannotBeUsed() {
        ImpersonationService service = new ImpersonationService(
                userRepository(
                        user(1L, "admin", UserRole.ADMIN, UserStatus.ACTIVE),
                        user(2L, "student", UserRole.STUDENT, UserStatus.ACTIVE)),
                proxy(ImpersonationSessionRepository.class, (method, args) -> Optional.empty()),
                new JwtService(),
                proxy(StorageService.class, (method, args) -> null));

        assertThrows(BadCredentialsException.class, () -> service.validateSession(
                7L,
                "student",
                "ROLE_STUDENT"));
    }

    private static UserRepository userRepository(User admin, User target) {
        return proxy(UserRepository.class, (method, args) -> {
            if (!"findById".equals(method)) {
                throw new UnsupportedOperationException(method);
            }
            return Optional.of((Long) args[0] == 1L ? admin : target);
        });
    }

    private static User user(Long id, String username, UserRole role, UserStatus status) {
        return User.builder()
                .id(id)
                .username(username)
                .role(role)
                .status(status)
                .build();
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
