package com.classmanagement.backend.service;

import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.UserAuthIdentity;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.repository.ImpersonationSessionRepository;
import com.classmanagement.backend.repository.UserAuthIdentityRepository;
import com.classmanagement.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.lang.reflect.Proxy;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

class GoogleOAuthAccountServiceTest {
    @Test
    void loginDoesNotAutomaticallyLinkAnExistingEmailAccount() {
        User existing = User.builder()
                .id(8L)
                .username("existing")
                .email("person@gmail.com")
                .fullName("Existing User")
                .role(UserRole.STUDENT)
                .status(UserStatus.ACTIVE)
                .build();
        GoogleOAuthAccountService service = service(existing, new AtomicReference<>(), new AtomicReference<>());

        var result = service.process(googleUser(), Map.of("app_intent", "login"));

        assertEquals("account_not_linked", result.status());
        assertNull(result.user());
    }

    @Test
    void signupCreatesAccountWithSelectedRoleAndLinksGoogleIdentity() {
        AtomicReference<UserAuthIdentity> savedIdentity = new AtomicReference<>();
        AtomicReference<User> savedUser = new AtomicReference<>();
        GoogleOAuthAccountService service = service(null, savedIdentity, savedUser);

        var result = service.process(googleUser(), Map.of(
                "app_intent", "signup",
                "app_role", "TEACHER"));

        assertEquals("account_pending", result.status());
        assertNotNull(savedIdentity.get());
        assertEquals(18L, savedIdentity.get().getUserId());
        assertEquals("GOOGLE", savedIdentity.get().getProvider());
        assertEquals("google-subject-1", savedIdentity.get().getProviderSubject());
        assertEquals("https://lh3.googleusercontent.com/google-avatar", savedUser.get().getAvatar());
    }

    @Test
    void linkingRequiresAnAuthenticatedAccount() {
        GoogleOAuthAccountService service = service(null, new AtomicReference<>(), new AtomicReference<>());

        var result = service.process(googleUser(), Map.of("app_intent", "link"));

        assertEquals("link_requires_login", result.status());
    }

    private static DefaultOAuth2User googleUser() {
        return new DefaultOAuth2User(
                java.util.List.of(new SimpleGrantedAuthority("ROLE_USER")),
                Map.of(
                        "sub", "google-subject-1",
                        "email", "person@gmail.com",
                        "email_verified", true,
                        "name", "Google Person",
                        "picture", "https://lh3.googleusercontent.com/google-avatar"),
                "sub");
    }

    private static GoogleOAuthAccountService service(
            User existingEmailUser,
            AtomicReference<UserAuthIdentity> savedIdentity,
            AtomicReference<User> savedUser) {
        UserRepository users = proxy(UserRepository.class, (method, args) -> switch (method) {
            case "findByEmailIgnoreCase" -> Optional.ofNullable(existingEmailUser);
            case "save" -> {
                User user = (User) args[0];
                if (user.getId() == null) user.setId(18L);
                savedUser.set(user);
                yield user;
            }
            default -> throw new UnsupportedOperationException(method);
        });
        UserAuthIdentityRepository identities = proxy(UserAuthIdentityRepository.class, (method, args) -> switch (method) {
            case "findByProviderAndProviderSubject", "findByUserIdAndProvider" -> Optional.empty();
            case "save" -> {
                UserAuthIdentity identity = (UserAuthIdentity) args[0];
                savedIdentity.set(identity);
                yield identity;
            }
            default -> throw new UnsupportedOperationException(method);
        });
        ImpersonationSessionRepository impersonationSessions = proxy(
                ImpersonationSessionRepository.class,
                (method, args) -> false);
        return new GoogleOAuthAccountService(users, identities, impersonationSessions);
    }

    private static <T> T proxy(Class<T> type, ProxyCall call) {
        return type.cast(Proxy.newProxyInstance(
                type.getClassLoader(),
                new Class<?>[]{type},
                (proxy, method, args) -> call.invoke(method.getName(), args)));
    }

    @FunctionalInterface
    private interface ProxyCall {
        Object invoke(String method, Object[] args) throws Throwable;
    }
}
