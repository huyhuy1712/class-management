package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.user.ChangePasswordRequest;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.repository.UserAuthIdentityRepository;
import com.classmanagement.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserPasswordChangeGoogleIdentityTest {
    @Test
    void googleLinkedAccountCannotChangePassword() {
        UserRepository users = mock(UserRepository.class);
        UserAuthIdentityRepository identities = mock(UserAuthIdentityRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        User user = User.builder().id(12L).username("google-user").build();
        when(users.findByUsername("google-user")).thenReturn(Optional.of(user));
        when(identities.findByUserIdAndProvider(12L, "GOOGLE")).thenReturn(Optional.of(
                com.classmanagement.backend.entity.UserAuthIdentity.builder()
                        .userId(12L)
                        .provider("GOOGLE")
                        .providerSubject("google-subject")
                        .build()));
        UserServiceImpl service = new UserServiceImpl(
                users, null, null, null, passwordEncoder, null, identities);
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("current");
        request.setNewPassword("new-password");

        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> service.changePassword("google-user", request));

        assertEquals("Tài khoản đã xác thực Google không thể đổi mật khẩu.", error.getMessage());
        verify(passwordEncoder, never()).matches(org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString());
    }
}
