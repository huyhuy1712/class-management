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
import static org.mockito.Mockito.verifyNoInteractions;
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
        record("POST", "/api/exam-assignments/42/attempts");
        record("POST", "/api/exam-attempts/43/submit");
        record("PUT", "/api/homework-assignments/44/submission");
        record("POST", "/api/requests/join-class/12");
        record("PUT", "/api/exam-attempts/43/answers");

        verify(activityService).record(8L, "START", "EXAM", 42L, null, "Bắt đầu làm bài kiểm tra");
        verify(activityService).record(8L, "SUBMIT", "EXAM", 43L, null, "Nộp bài kiểm tra");
        verify(activityService).record(8L, "SUBMIT", "HOMEWORK", 44L, null, "Nộp bài tập");
        verify(activityService).record(8L, "REQUEST_JOIN", "CLASSROOM", 12L, 12L,
                "Gửi yêu cầu tham gia lớp học");
        verifyNoMoreInteractions(activityService);
    }

    @Test
    void leavesAttendanceAndFeedCreationLoggingToServicesForSpecificDetails() {
        record("POST", "/api/classes/12/attendances");
        record("POST", "/api/classes/12/feed/posts");
        record("POST", "/api/classes/12/feed/posts/90/comments");

        verifyNoInteractions(activityService);
    }

    @Test
    void leavesHomeworkCreationLoggingToServiceForAssignmentTitle() {
        User teacher = User.builder().id(9L).role(UserRole.TEACHER).build();
        when(userRepository.findByUsername("teacher")).thenReturn(Optional.of(teacher));
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated("teacher", "password", List.of()));

        record("POST", "/api/homework-assignments");
        record("PUT", "/api/homework-assignments/44");

        verifyNoInteractions(activityService);
    }

    @Test
    void leavesExamCreationAndCopyLoggingToServiceForExamTitle() {
        User teacher = User.builder().id(9L).role(UserRole.TEACHER).build();
        when(userRepository.findByUsername("teacher")).thenReturn(Optional.of(teacher));
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated("teacher", "password", List.of()));

        record("POST", "/api/exams");
        record("POST", "/api/exams/42/copy");
        record("PUT", "/api/exams/42");
        record("PUT", "/api/exams/42/content");
        record("PATCH", "/api/exams/42/publish");
        record("PATCH", "/api/exams/42/unpublish");
        record("PATCH", "/api/exams/42/assignments/90/result-settings");

        verifyNoInteractions(activityService);
    }

    @Test
    void distinguishesExamResetHomeworkDeadlineAndStudentGradingActions() {
        User teacher = User.builder().id(9L).role(UserRole.TEACHER).build();
        when(userRepository.findByUsername("teacher")).thenReturn(Optional.of(teacher));
        when(userRepository.findById(25L)).thenReturn(Optional.of(
                User.builder().id(25L).fullName("Nguyễn An").build()));
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated("teacher", "password", List.of()));

        record("POST", "/api/exam-attempts/43/reset");
        record("PUT", "/api/homework-assignments/44/deadline");
        record("PUT", "/api/homework-assignments/44/submissions/25/grade");
        record("PATCH", "/api/classes/12/archive");
        record("POST", "/api/classes/12/students/import");

        verify(activityService).record(9L, "RESET", "EXAM", 43L, null, "Đặt lại lượt làm đề thi");
        verify(activityService).record(9L, "UPDATE_DEADLINE", "HOMEWORK", 44L, null,
                "Cập nhật hạn nộp bài tập");
        verify(activityService).record(9L, "GRADE", "HOMEWORK", 44L, null,
                "Chấm điểm bài tập — học sinh Nguyễn An");
        verify(activityService).record(9L, "ARCHIVE", "CLASSROOM", 12L, 12L, "Lưu trữ lớp học");
        verify(activityService).record(9L, "IMPORT", "STUDENT", null, 12L, "Nhập học sinh");
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
