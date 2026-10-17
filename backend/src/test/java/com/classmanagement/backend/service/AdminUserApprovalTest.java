package com.classmanagement.backend.service;

import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.repository.UserRepository;
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
        AdminUserService service = new AdminUserService(users, null, null);

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
        AdminUserService service = new AdminUserService(users, null, null);

        assertThrows(IllegalStateException.class, () -> service.approveUser(42L));

        verify(users, never()).save(org.mockito.ArgumentMatchers.any(User.class));
    }

    @Test
    void blocksAndUnblocksAccountWithoutChangingOtherAccountFields() {
        UserRepository users = mock(UserRepository.class);
        User activeUser = user(UserStatus.ACTIVE);
        when(users.findById(42L)).thenReturn(Optional.of(activeUser));
        when(users.save(activeUser)).thenReturn(activeUser);
        AdminUserService service = new AdminUserService(users, null, null);

        var blocked = service.setBlocked(42L, true);
        assertEquals(UserStatus.BANNED, blocked.getStatus());
        assertEquals("legacy phone value", activeUser.getPhone());

        var unblocked = service.setBlocked(42L, false);
        assertEquals(UserStatus.ACTIVE, unblocked.getStatus());
        assertEquals("legacy phone value", activeUser.getPhone());
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
