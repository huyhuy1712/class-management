package com.classmanagement.backend.service;

import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.UserAuthIdentity;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.repository.UserAuthIdentityRepository;
import com.classmanagement.backend.repository.ImpersonationSessionRepository;
import com.classmanagement.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class GoogleOAuthAccountService {
    private static final String PROVIDER = "GOOGLE";

    private final UserRepository users;
    private final UserAuthIdentityRepository identities;
    private final ImpersonationSessionRepository impersonationSessions;
    private final GoogleAvatarStorage googleAvatarStorage;

    @Transactional
    public Result process(OAuth2User googleUser, Map<String, String> context) {
        String subject = googleUser.getAttribute("sub");
        String email = googleUser.getAttribute("email");
        Object verified = googleUser.getAttribute("email_verified");
        if (subject == null || email == null || !Boolean.TRUE.equals(verified)) {
            return new Result("email_unverified", null);
        }

        String intent = context.getOrDefault("app_intent", "login");
        if ("link".equals(intent)) {
            return link(subject, email, googleAvatarUrl(googleUser), context.get("app_username"));
        }

        var linkedIdentity = identities.findByProviderAndProviderSubject(PROVIDER, subject);
        if (linkedIdentity.isPresent()) {
            User user = users.findById(linkedIdentity.get().getUserId()).orElse(null);
            if (user != null) {
                storeGoogleAvatar(user, googleAvatarUrl(googleUser));
            }
            return user == null ? new Result("account_unavailable", null) : accountResult(user);
        }

        if (!"signup".equals(intent)) return new Result("account_not_linked", null);

        UserRole role = parseRole(context.get("app_role"));
        if (role == null) return new Result("signup_role_missing", null);

        if (users.findByEmailIgnoreCase(email).isPresent()) {
            return new Result("account_requires_link", null);
        }

        String fullName = googleUser.getAttribute("name");
        if (fullName == null || fullName.isBlank()) fullName = email.substring(0, email.indexOf('@'));

        User user = users.save(User.builder()
                .username("google-" + UUID.randomUUID().toString().replace("-", ""))
                .passwordHash(null)
                .email(email)
                .fullName(fullName.length() <= 100 ? fullName : fullName.substring(0, 100))
                .role(role)
                .status(role == UserRole.TEACHER ? UserStatus.PENDING : UserStatus.ACTIVE)
                .build());
        storeGoogleAvatar(user, googleAvatarUrl(googleUser));
        if (role == UserRole.TEACHER) user.setTeacherCode("TC-" + user.getId());
        else user.setStudentCode("ST-" + user.getId());
        user = users.save(user);
        identities.save(UserAuthIdentity.builder()
                .userId(user.getId())
                .provider(PROVIDER)
                .providerSubject(subject)
                .emailAtLink(email)
                .build());

        return accountResult(user);
    }

    private Result link(String subject, String email, String avatarUrl, String username) {
        if (username == null || username.isBlank()) return new Result("link_requires_login", null);
        User user = users.findByUsername(username).orElse(null);
        if (user == null) return new Result("link_requires_login", null);

        var existing = identities.findByProviderAndProviderSubject(PROVIDER, subject);
        if (existing.isPresent()) {
            if (!existing.get().getUserId().equals(user.getId())) {
                return new Result("google_already_linked", null);
            }
            storeGoogleAvatar(user, avatarUrl);
            return new Result("linked", user);
        }
        if (identities.findByUserIdAndProvider(user.getId(), PROVIDER).isPresent()) {
            return new Result("account_already_linked", null);
        }

        identities.save(UserAuthIdentity.builder()
                .userId(user.getId())
                .provider(PROVIDER)
                .providerSubject(subject)
                .emailAtLink(email)
                .build());
        storeGoogleAvatar(user, avatarUrl);
        return new Result("linked", user);
    }

    private String googleAvatarUrl(OAuth2User googleUser) {
        Object picture = googleUser.getAttribute("picture");
        if (!(picture instanceof String url)
                || !url.startsWith("https://")
                || url.length() > 500) {
            return null;
        }
        return url;
    }

    private void storeGoogleAvatar(User user, String avatarUrl) {
        googleAvatarStorage.storeIfNeeded(user.getId(), user.getAvatar(), avatarUrl)
                .ifPresent(objectPath -> {
                    user.setAvatar(objectPath);
                    try {
                        users.save(user);
                    } catch (RuntimeException exception) {
                        try {
                            googleAvatarStorage.delete(objectPath);
                        } catch (RuntimeException cleanupException) {
                            exception.addSuppressed(cleanupException);
                        }
                        throw exception;
                    }
                });
    }

    private Result accountResult(User user) {
        if (user.getStatus() == UserStatus.PENDING) return new Result("account_pending", null);
        if (user.getStatus() == UserStatus.BANNED) return new Result("account_banned", null);
        if ((user.getRole() == UserRole.STUDENT || user.getRole() == UserRole.TEACHER)
                && impersonationSessions.existsByTargetUserIdAndEndedAtIsNullAndExpiresAtAfter(
                        user.getId(), Instant.now())) {
            return new Result("account_in_use", null);
        }
        return new Result("login", user);
    }

    private UserRole parseRole(String role) {
        if (role == null) return null;
        try {
            UserRole parsed = UserRole.valueOf(role.toUpperCase(Locale.ROOT));
            return parsed == UserRole.STUDENT || parsed == UserRole.TEACHER ? parsed : null;
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    public record Result(String status, User user) {}
}
