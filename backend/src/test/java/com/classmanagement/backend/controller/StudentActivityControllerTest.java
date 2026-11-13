package com.classmanagement.backend.controller;

import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.service.TeacherActivityService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StudentActivityControllerTest {

    @Test
    void returnsActivityScopedToAuthenticatedStudent() {
        UserRepository userRepository = mock(UserRepository.class);
        TeacherActivityService activityService = mock(TeacherActivityService.class);
        when(userRepository.findByUsername("student"))
                .thenReturn(Optional.of(User.builder().id(18L).role(UserRole.STUDENT).build()));
        var authentication = UsernamePasswordAuthenticationToken.authenticated("student", "password", java.util.List.of());

        new StudentActivityController(activityService, userRepository)
                .getActivity(authentication, 0, 20, null, null, null, null, "newest");

        verify(activityService).getActivity(18L, 0, 20, null, null, null, null, "newest");
    }

    @Test
    void rejectsNonStudentRoles() {
        UserRepository userRepository = mock(UserRepository.class);
        TeacherActivityService activityService = mock(TeacherActivityService.class);
        when(userRepository.findByUsername("teacher"))
                .thenReturn(Optional.of(User.builder().id(19L).role(UserRole.TEACHER).build()));
        var authentication = UsernamePasswordAuthenticationToken.authenticated("teacher", "password", java.util.List.of());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> new StudentActivityController(activityService, userRepository)
                        .getActivity(authentication, 0, 20, null, null, null, null, "newest"));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }
}
