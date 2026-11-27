package com.classmanagement.backend.service;

import com.classmanagement.backend.entity.TeacherActivityLog;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.repository.TeacherActivityLogRepository;
import com.classmanagement.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TeacherActivityServiceTest {

    @Test
    void recordsGenericActivityWithResourceAndClassNames() {
        TeacherActivityLogRepository repository = mock(TeacherActivityLogRepository.class);
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(jdbc.query(eq("SELECT title FROM homework_assignments WHERE id = ?"),
                org.mockito.ArgumentMatchers.<RowMapper<String>>any(), eq(81L)))
                .thenReturn(List.of("Phương trình bậc hai"));
        when(jdbc.query(eq("SELECT name FROM classes WHERE id = ?"),
                org.mockito.ArgumentMatchers.<RowMapper<String>>any(), eq(12L)))
                .thenReturn(List.of("Toán 10A"));

        new TeacherActivityService(repository, mock(UserRepository.class), jdbc)
                .record(9L, "GRADE", "HOMEWORK", 81L, 12L, "Chấm điểm bài tập");

        verify(repository).save(argThat(log ->
                "Chấm điểm bài tập: bài tập Phương trình bậc hai — lớp Toán 10A".equals(log.getSummary())));
    }

    @Test
    void clampsPaginationAndReturnsTeacherSummary() {
        TeacherActivityLogRepository repository = mock(TeacherActivityLogRepository.class);
        when(repository.findAll(
                org.mockito.ArgumentMatchers.<Specification<TeacherActivityLog>>any(),
                org.mockito.ArgumentMatchers.<Pageable>any()))
                .thenAnswer(invocation -> new PageImpl<TeacherActivityLog>(
                        List.of(), invocation.getArgument(1), 0));
        when(repository.countByActorId(12L)).thenReturn(41L);
        when(repository.countByActorIdAndOccurredAtGreaterThanEqual(eq(12L), any())).thenReturn(9L);
        when(repository.countResourceTypesByActorId(12L)).thenReturn(4L);

        var result = service(repository, mock(UserRepository.class))
                .getActivity(12L, -2, 500, "  ", "all", null, null, "newest");

        assertEquals(0, result.page());
        assertEquals(100, result.size());
        assertEquals(41L, result.summary().totalActivities());
        assertEquals(9L, result.summary().last30Days());
        assertEquals(4L, result.summary().categoryCount());
        verify(repository).findAll(
                org.mockito.ArgumentMatchers.<Specification<TeacherActivityLog>>any(),
                matchingPageable());
    }

    @Test
    void rejectsUnsupportedCategoriesAndReversedDateRanges() {
        TeacherActivityService service = service(
                mock(TeacherActivityLogRepository.class), mock(UserRepository.class));

        assertThrows(IllegalArgumentException.class,
                () -> service.getActivity(12L, 0, 20, null, "UNKNOWN", null, null, "newest"));
        assertThrows(IllegalArgumentException.class,
                () -> service.getActivity(12L, 0, 20, null, null,
                        LocalDate.of(2026, 2, 1), LocalDate.of(2026, 1, 1), "newest"));
        assertThrows(IllegalArgumentException.class,
                () -> service.getActivity(12L, 0, 20, null, null, null, null, "random"));
    }

    @Test
    void acceptsBillingActivityCategories() {
        TeacherActivityLogRepository repository = mock(TeacherActivityLogRepository.class);
        when(repository.findAll(
                org.mockito.ArgumentMatchers.<Specification<TeacherActivityLog>>any(),
                org.mockito.ArgumentMatchers.<Pageable>any()))
                .thenAnswer(invocation -> new PageImpl<TeacherActivityLog>(
                        List.of(), invocation.getArgument(1), 0));
        when(repository.countByActorId(12L)).thenReturn(0L);
        when(repository.countByActorIdAndOccurredAtGreaterThanEqual(eq(12L), any())).thenReturn(0L);
        when(repository.countResourceTypesByActorId(12L)).thenReturn(0L);

        TeacherActivityService activityService = service(repository, mock(UserRepository.class));

        for (String category : List.of("VIP", "POINTS", "MISSION")) {
            assertEquals(0, activityService
                    .getActivity(12L, 0, 20, null, category, null, null, "newest")
                    .totalElements());
        }
    }

    @Test
    void supportsOldestFirstSorting() {
        TeacherActivityLogRepository repository = mock(TeacherActivityLogRepository.class);
        when(repository.findAll(
                org.mockito.ArgumentMatchers.<Specification<TeacherActivityLog>>any(),
                org.mockito.ArgumentMatchers.<Pageable>any()))
                .thenAnswer(invocation -> new PageImpl<TeacherActivityLog>(
                        List.of(), invocation.getArgument(1), 0));
        when(repository.countByActorId(12L)).thenReturn(0L);
        when(repository.countByActorIdAndOccurredAtGreaterThanEqual(eq(12L), any())).thenReturn(0L);
        when(repository.countResourceTypesByActorId(12L)).thenReturn(0L);

        service(repository, mock(UserRepository.class))
                .getActivity(12L, 0, 20, null, null, null, null, "oldest");

        verify(repository).findAll(
                org.mockito.ArgumentMatchers.<Specification<TeacherActivityLog>>any(),
                matchingAscendingPageable());
    }

    @Test
    void returnsAdminActivityWithActorDetailsAndClampedPagination() {
        TeacherActivityLogRepository repository = mock(TeacherActivityLogRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        TeacherActivityLog log = TeacherActivityLog.builder()
                .id(3L)
                .actorId(21L)
                .action("SUBMIT")
                .resourceType("EXAM")
                .resourceId(45L)
                .summary("Nộp bài kiểm tra")
                .build();
        when(repository.findAll(
                org.mockito.ArgumentMatchers.<Specification<TeacherActivityLog>>any(),
                org.mockito.ArgumentMatchers.<Pageable>any()))
                .thenAnswer(invocation -> new PageImpl<TeacherActivityLog>(
                        List.of(log), invocation.getArgument(1), 1));
        when(userRepository.findAllById(any())).thenReturn(List.of(
                User.builder().id(21L).fullName("Nguyễn An").username("nguyenan")
                        .role(UserRole.STUDENT).build()));
        when(repository.count()).thenReturn(100L);
        when(repository.countByOccurredAtGreaterThanEqual(any())).thenReturn(12L);
        when(repository.countDistinctResourceTypes()).thenReturn(5L);

        var result = service(repository, userRepository)
                .getAdminActivity(-1, 200, null, null, UserRole.STUDENT, null,
                        null, null, "newest");

        assertEquals(0, result.page());
        assertEquals(100, result.size());
        assertEquals(100L, result.summary().totalActivities());
        assertEquals("Nguyễn An", result.items().getFirst().actorName());
        assertEquals("nguyenan", result.items().getFirst().actorUsername());
        assertEquals(UserRole.STUDENT, result.items().getFirst().actorRole());
        verify(repository).findAll(
                org.mockito.ArgumentMatchers.<Specification<TeacherActivityLog>>any(),
                matchingPageable());
    }

    @Test
    void includesRoleAwareTargetPathForStudentExamSubmission() {
        TeacherActivityLogRepository repository = mock(TeacherActivityLogRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        TeacherActivityLog log = TeacherActivityLog.builder()
                .id(3L)
                .actorId(21L)
                .action("SUBMIT")
                .resourceType("EXAM")
                .resourceId(45L)
                .summary("Nộp bài kiểm tra")
                .build();
        when(repository.findAll(
                org.mockito.ArgumentMatchers.<Specification<TeacherActivityLog>>any(),
                org.mockito.ArgumentMatchers.<Pageable>any()))
                .thenAnswer(invocation -> new PageImpl<TeacherActivityLog>(
                        List.of(log), invocation.getArgument(1), 1));
        when(userRepository.findAllById(any())).thenReturn(List.of(
                User.builder().id(21L).fullName("Nguyễn An").role(UserRole.STUDENT).build()));
        when(repository.count()).thenReturn(1L);
        when(repository.countByOccurredAtGreaterThanEqual(any())).thenReturn(1L);
        when(repository.countDistinctResourceTypes()).thenReturn(1L);

        var result = service(repository, userRepository)
                .getAdminActivity(0, 20, null, null, UserRole.STUDENT, null,
                        null, null, "newest");

        assertEquals("/student/exam-attempts/45/result", result.items().getFirst().targetPath());
    }

    @Test
    void includesTeacherAttemptReviewTargetPath() {
        TeacherActivityLogRepository repository = mock(TeacherActivityLogRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        TeacherActivityLog log = TeacherActivityLog.builder()
                .id(4L)
                .actorId(12L)
                .action("GRADE")
                .resourceType("EXAM")
                .resourceId(45L)
                .summary("Chấm điểm bài kiểm tra")
                .build();
        String attemptPath = """
                SELECT '/teacher/exams/' || e.id || '/assignments/' || a.id || '/attempts/' || t.id
                FROM exam_attempts t
                JOIN exam_assignments a ON a.id = t.assignment_id
                JOIN exams e ON e.id = a.exam_id
                WHERE t.id = ?
                """;
        when(repository.findAll(
                org.mockito.ArgumentMatchers.<Specification<TeacherActivityLog>>any(),
                org.mockito.ArgumentMatchers.<Pageable>any()))
                .thenAnswer(invocation -> new PageImpl<TeacherActivityLog>(
                        List.of(log), invocation.getArgument(1), 1));
        when(repository.countByActorId(12L)).thenReturn(1L);
        when(repository.countByActorIdAndOccurredAtGreaterThanEqual(eq(12L), any())).thenReturn(1L);
        when(repository.countResourceTypesByActorId(12L)).thenReturn(1L);
        when(userRepository.findById(12L)).thenReturn(Optional.of(
                User.builder().id(12L).role(UserRole.TEACHER).build()));
        when(jdbc.query(eq(attemptPath),
                org.mockito.ArgumentMatchers.<RowMapper<String>>any(), eq(45L)))
                .thenReturn(List.of("/teacher/exams/8/assignments/17/attempts/45"));

        var result = new TeacherActivityService(repository, userRepository, jdbc)
                .getActivity(12L, 0, 20, null, null, null, null, "newest");

        assertEquals("/teacher/exams/8/assignments/17/attempts/45",
                result.items().getFirst().targetPath());
    }

    @Test
    void sendsStudentsToClassListForPendingJoinRequests() {
        TeacherActivityLogRepository repository = mock(TeacherActivityLogRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        TeacherActivityLog log = TeacherActivityLog.builder()
                .id(5L)
                .actorId(21L)
                .action("REQUEST_JOIN")
                .resourceType("CLASSROOM")
                .resourceId(12L)
                .classId(12L)
                .summary("Gửi yêu cầu tham gia lớp học")
                .build();
        when(repository.findAll(
                org.mockito.ArgumentMatchers.<Specification<TeacherActivityLog>>any(),
                org.mockito.ArgumentMatchers.<Pageable>any()))
                .thenAnswer(invocation -> new PageImpl<TeacherActivityLog>(
                        List.of(log), invocation.getArgument(1), 1));
        when(repository.countByActorId(21L)).thenReturn(1L);
        when(repository.countByActorIdAndOccurredAtGreaterThanEqual(eq(21L), any())).thenReturn(1L);
        when(repository.countResourceTypesByActorId(21L)).thenReturn(1L);
        when(userRepository.findById(21L)).thenReturn(Optional.of(
                User.builder().id(21L).role(UserRole.STUDENT).build()));

        var result = service(repository, userRepository)
                .getActivity(21L, 0, 20, null, null, null, null, "newest");

        assertEquals("/student/classes", result.items().getFirst().targetPath());
    }

    @Test
    void allowsAdminQueryWithoutFilters() {
        TeacherActivityLogRepository repository = mock(TeacherActivityLogRepository.class);
        when(repository.findAll(
                org.mockito.ArgumentMatchers.<Specification<TeacherActivityLog>>any(),
                org.mockito.ArgumentMatchers.<Pageable>any()))
                .thenAnswer(invocation -> new PageImpl<TeacherActivityLog>(
                        List.of(), invocation.getArgument(1), 0));
        when(repository.count()).thenReturn(0L);
        when(repository.countByOccurredAtGreaterThanEqual(any())).thenReturn(0L);
        when(repository.countDistinctResourceTypes()).thenReturn(0L);

        var result = service(repository, mock(UserRepository.class))
                .getAdminActivity(0, 20, null, null, null, null, null, null, "newest");

        assertEquals(0, result.totalElements());
        assertEquals(0L, result.summary().totalActivities());
        verify(repository).findAll(
                org.mockito.ArgumentMatchers.<Specification<TeacherActivityLog>>any(),
                matchingStandardPageable());
    }

    private Pageable matchingPageable() {
        return org.mockito.ArgumentMatchers.argThat(pageable ->
                pageable.getPageNumber() == 0 && pageable.getPageSize() == 100
                        && pageable.getSort().getOrderFor("occurredAt").isDescending()
                        && pageable.getSort().getOrderFor("id").isDescending());
    }

    private TeacherActivityService service(
            TeacherActivityLogRepository repository,
            UserRepository userRepository) {
        return new TeacherActivityService(repository, userRepository, mock(JdbcTemplate.class));
    }

    private Pageable matchingAscendingPageable() {
        return org.mockito.ArgumentMatchers.argThat(pageable ->
                pageable.getSort().getOrderFor("occurredAt").isAscending()
                        && pageable.getSort().getOrderFor("id").isAscending());
    }

    private Pageable matchingStandardPageable() {
        return org.mockito.ArgumentMatchers.argThat(pageable ->
                pageable.getPageNumber() == 0 && pageable.getPageSize() == 20
                        && pageable.getSort().getOrderFor("occurredAt").isDescending()
                        && pageable.getSort().getOrderFor("id").isDescending());
    }
}
