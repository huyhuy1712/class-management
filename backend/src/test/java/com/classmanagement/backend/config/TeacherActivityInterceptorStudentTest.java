package com.classmanagement.backend.config;

import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.service.TeacherActivityService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

class TeacherActivityInterceptorStudentTest {

    private UserRepository userRepository;
    private TeacherActivityService activityService;
    private TeacherActivityInterceptor interceptor;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        activityService = mock(TeacherActivityService.class);
        interceptor = new TeacherActivityInterceptor(userRepository, activityService);

        User student = User.builder().id(8L).role(UserRole.STUDENT).build();
        when(userRepository.findByUsername("student")).thenReturn(Optional.of(student));
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated("student", "password", List.of()));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void recordsMeaningfulStudentActionsButNotExamAnswerAutosaves() {
        record("POST", "/api/classes/12/attendances");
        record("POST", "/api/exam-assignments/42/attempts");
        record("POST", "/api/exam-attempts/43/submit");
        record("PUT", "/api/homework-assignments/44/submission");
        record("POST", "/api/requests/join-class/12");
        record("POST", "/api/classes/12/feed/posts");
        record("POST", "/api/classes/12/feed/posts/90/comments");
        record("PUT", "/api/exam-attempts/43/answers");

        verify(activityService).record(8L, "ATTEND", "ATTENDANCE", null, 12L, "Điểm danh lớp học");
        verify(activityService).record(8L, "START", "EXAM", 42L, null, "Bắt đầu làm bài kiểm tra");
        verify(activityService).record(8L, "SUBMIT", "EXAM", 43L, null, "Nộp bài kiểm tra");
        verify(activityService).record(8L, "SUBMIT", "HOMEWORK", 44L, null, "Nộp bài tập");
        verify(activityService).record(8L, "REQUEST_JOIN", "CLASSROOM", 12L, 12L,
                "Gửi yêu cầu tham gia lớp học");
        verify(activityService).record(8L, "CREATE", "CLASS_FEED", null, 12L,
                "Đăng bài lên bảng tin lớp");
        verify(activityService).record(8L, "COMMENT", "CLASS_FEED", 90L, 12L,
                "Bình luận bài viết lớp học");
        verifyNoMoreInteractions(activityService);
    }

    private void record(String method, String path) {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        when(request.getMethod()).thenReturn(method);
        when(request.getRequestURI()).thenReturn(path);
        when(response.getStatus()).thenReturn(200);
        interceptor.afterCompletion(request, response, null, null);
    }
}
