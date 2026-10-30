package com.classmanagement.backend.service;

import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.UserAuthIdentity;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.repository.ImpersonationSessionRepository;
import com.classmanagement.backend.repository.UserAuthIdentityRepository;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.service.GoogleAvatarStorage;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.lang.reflect.Proxy;
import java.util.Map;
import java.util.Optional;
import java.util.function.Predicate;
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
        assertEquals("google - Google Person", savedUser.get().getUsername());
        assertNotNull(savedIdentity.get());
        assertEquals(18L, savedIdentity.get().getUserId());
        assertEquals("GOOGLE", savedIdentity.get().getProvider());
        assertEquals("google-subject-1", savedIdentity.get().getProviderSubject());
        assertEquals("avatars/google/google-avatar.jpg", savedUser.get().getAvatar());
    }

    @Test
    void signupAddsANumberWhenTheGeneratedUsernameAlreadyExists() {
        AtomicReference<User> savedUser = new AtomicReference<>();
        GoogleOAuthAccountService service = service(
                null,
                new AtomicReference<>(),
                savedUser,
                username -> username.equals("google - Google Person"));

        service.process(googleUser(), Map.of(
                "app_intent", "signup",
                "app_role", "STUDENT"));

        assertEquals("google - Google Person (2)", savedUser.get().getUsername());
    }

    @Test
    void linkingRequiresAnAuthenticatedAccount() {
        GoogleOAuthAccountService service = service(null, new AtomicReference<>(), new AtomicReference<>());

        var result = service.process(googleUser(), Map.of("app_intent", "link"));

        assertEquals("link_requires_login", result.status());
    }

    @Test
    void linkingGoogleReplacesTheAvatarSoEmailLoginUsesTheGoogleImage() {
        User existing = User.builder()
                .id(8L)
                .username("existing")
                .email("person@gmail.com")
                .fullName("Existing User")
                .avatar("https://lh3.googleusercontent.com/old-avatar")
                .role(UserRole.STUDENT)
                .status(UserStatus.ACTIVE)
                .build();
        UserRepository users = proxy(UserRepository.class, (method, args) -> switch (method) {
            case "findByUsername" -> Optional.of(existing);
            case "save" -> args[0];
            default -> throw new UnsupportedOperationException(method);
        });
        UserAuthIdentityRepository identities = proxy(UserAuthIdentityRepository.class, (method, args) -> switch (method) {
            case "findByProviderAndProviderSubject", "findByUserIdAndProvider" -> Optional.empty();
            case "save" -> args[0];
            default -> throw new UnsupportedOperationException(method);
        });
        ImpersonationSessionRepository impersonationSessions = proxy(
                ImpersonationSessionRepository.class,
                (method, args) -> false);
        GoogleOAuthAccountService service = new GoogleOAuthAccountService(
                users, identities, impersonationSessions, googleAvatarStorage());

        var result = service.process(googleUser(), Map.of(
                "app_intent", "link",
                "app_username", "existing"));

        assertEquals("linked", result.status());
        assertEquals("avatars/google/google-avatar.jpg", existing.getAvatar());
    }

    @Test
    void googleLoginUpdatesTheAvatarForAnAlreadyLinkedAccount() {
        User existing = User.builder()
                .id(8L)
                .username("existing")
                .email("person@gmail.com")
                .fullName("Existing User")
                .avatar(null)
                .role(UserRole.STUDENT)
                .status(UserStatus.ACTIVE)
                .build();
        UserAuthIdentity identity = UserAuthIdentity.builder()
                .userId(8L)
                .provider("GOOGLE")
                .providerSubject("google-subject-1")
                .build();
        UserRepository users = proxy(UserRepository.class, (method, args) -> switch (method) {
            case "findById" -> Optional.of(existing);
            case "save" -> args[0];
            default -> throw new UnsupportedOperationException(method);
        });
        UserAuthIdentityRepository identities = proxy(UserAuthIdentityRepository.class, (method, args) ->
                method.equals("findByProviderAndProviderSubject")
                        ? Optional.of(identity)
                        : throwUnsupported(method));
        ImpersonationSessionRepository impersonationSessions = proxy(
                ImpersonationSessionRepository.class,
                (method, args) -> false);
        GoogleOAuthAccountService service = new GoogleOAuthAccountService(
                users, identities, impersonationSessions, googleAvatarStorage());

        var result = service.process(googleUser(), Map.of("app_intent", "login"));

        assertEquals("login", result.status());
        assertEquals("avatars/google/google-avatar.jpg", existing.getAvatar());
    }

    private static Object throwUnsupported(String method) {
        throw new UnsupportedOperationException(method);
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
        return service(existingEmailUser, savedIdentity, savedUser, username -> false);
    }

    private static GoogleOAuthAccountService service(
            User existingEmailUser,
            AtomicReference<UserAuthIdentity> savedIdentity,
            AtomicReference<User> savedUser,
            Predicate<String> usernameExists) {
        UserRepository users = proxy(UserRepository.class, (method, args) -> switch (method) {
            case "findByEmailIgnoreCase" -> Optional.ofNullable(existingEmailUser);
            case "existsByUsername" -> usernameExists.test((String) args[0]);
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
        return new GoogleOAuthAccountService(users, identities, impersonationSessions, googleAvatarStorage());
    }

    private static GoogleAvatarStorage googleAvatarStorage() {
        return proxy(GoogleAvatarStorage.class, (method, args) -> switch (method) {
            case "storeIfNeeded" -> {
                String currentAvatar = (String) args[1];
                if (currentAvatar == null
                        || currentAvatar.isBlank()
                        || currentAvatar.startsWith("http://")
                        || currentAvatar.startsWith("https://")) {
                    yield Optional.of("avatars/google/google-avatar.jpg");
                }
                yield Optional.empty();
            }
            case "delete" -> null;
            default -> throw new UnsupportedOperationException(method);
        });
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
