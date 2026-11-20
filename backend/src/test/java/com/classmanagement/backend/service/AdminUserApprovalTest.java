package com.classmanagement.backend.service;

import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.dto.user.AdminVipRequest;
import com.classmanagement.backend.entity.billing.TeacherVipSubscription;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.billing.TeacherVipSubscriptionRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminUserApprovalTest {

    @Test
    void approvesPendingUserWithoutChangingOtherAccountFields() {
        UserRepository users = mock(UserRepository.class);
        User pendingUser = user(UserStatus.PENDING);
        when(users.findById(42L)).thenReturn(Optional.of(pendingUser));
        when(users.save(pendingUser)).thenReturn(pendingUser);
        AdminUserService service = new AdminUserService(users, null, null, null, null);

        var response = service.approveUser(42L);

        assertEquals(UserStatus.ACTIVE, pendingUser.getStatus());
        assertEquals("legacy phone value", pendingUser.getPhone());
        assertEquals(UserStatus.ACTIVE, response.getStatus());
        verify(users).save(pendingUser);
    }

    @Test
    void doesNotApproveAccountThatIsNotPending() {
        UserRepository users = mock(UserRepository.class);
        when(users.findById(42L)).thenReturn(Optional.of(user(UserStatus.BANNED)));
        AdminUserService service = new AdminUserService(users, null, null, null, null);

        assertThrows(IllegalStateException.class, () -> service.approveUser(42L));

        verify(users, never()).save(org.mockito.ArgumentMatchers.any(User.class));
    }

    @Test
    void blocksAndUnblocksAccountWithoutChangingOtherAccountFields() {
        UserRepository users = mock(UserRepository.class);
        User activeUser = user(UserStatus.ACTIVE);
        when(users.findById(42L)).thenReturn(Optional.of(activeUser));
        when(users.save(activeUser)).thenReturn(activeUser);
        AdminUserService service = new AdminUserService(users, null, null, null, null);

        var blocked = service.setBlocked(42L, true);
        assertEquals(UserStatus.BANNED, blocked.getStatus());
        assertEquals("legacy phone value", activeUser.getPhone());

        var unblocked = service.setBlocked(42L, false);
        assertEquals(UserStatus.ACTIVE, unblocked.getStatus());
        assertEquals("legacy phone value", activeUser.getPhone());
    }

    @Test
    void grantsPermanentVipToTeacher() {
        UserRepository users = mock(UserRepository.class);
        TeacherVipSubscriptionRepository subscriptions = mock(TeacherVipSubscriptionRepository.class);
        TeacherVipSubscription subscription = new TeacherVipSubscription();
        when(users.findById(42L)).thenReturn(Optional.of(user(UserStatus.ACTIVE)));
        when(subscriptions.findLockedByTeacherAndTier(42L, "TEN_DEVICES"))
                .thenReturn(Optional.of(subscription));
        AdminUserService service = new AdminUserService(users, null, null, null, subscriptions);

        service.grantVip(42L, new AdminVipRequest("TEN_DEVICES", null, true));

        assertEquals(10, subscription.getDeviceLimit());
        assertEquals(TeacherVipSubscription.PERMANENT_EXPIRY, subscription.getExpiresAt());
        verify(subscriptions).deleteAllByTeacherIdAndVipTierNot(42L, "TEN_DEVICES");
        verify(subscriptions).save(subscription);
    }

    private static User user(UserStatus status) {
        return User.builder()
                .id(42L)
                .username("test-user")
                .email("test@example.com")
                .fullName("Test User")
                .phone("legacy phone value")
                .role(UserRole.TEACHER)
                .status(status)
                .build();
    }
}
