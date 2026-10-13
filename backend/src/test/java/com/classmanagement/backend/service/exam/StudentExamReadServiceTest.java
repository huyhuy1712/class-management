package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.dto.exam.StudentExamResponse;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.exam.StudentExamReadRepository;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import java.lang.reflect.Proxy;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class StudentExamReadServiceTest {
    private final LocalDateTime now = LocalDateTime.of(2026, 10, 13, 10, 0);
    private String examStatus = "PUBLISHED", assignmentStatus = "OPEN", attemptStatus = "NOT_STARTED";
    private LocalDateTime open, close, started;
    private int limit = 2, used;
    private UserRole role = UserRole.STUDENT;
    private boolean accessible = true;
    private int rows = 100;
    private final List<String> calls = new ArrayList<>();
    private MapSqlParameterSource parameters;

    @Test void openAssignmentCanStartWithoutAttemptMutation() {
        assertTrue(result().canStart()); assertFalse(result().canResume());
    }
    @Test void scheduledAssignmentStartsOnlyOnceOpenTimeArrives() {
        assignmentStatus = "SCHEDULED"; open = now.plusMinutes(1);
        assertEquals("NOT_OPEN_YET", result().blockedReason());
        open = now; assertTrue(result().canStart());
    }
    @Test void closeTimeIsExclusiveAndExamClosedCannotStart() {
        close = now; assertEquals("CLOSED", result().blockedReason());
        close = null; examStatus = "CLOSED"; assertFalse(result().canStart());
    }
    @Test void unlimitedAttemptsCanStartAgainAfterLastGradedResult() {
        limit = 0; used = 50; attemptStatus = "GRADED";
        assertTrue(result().canStart()); assertEquals(50, result().attemptsUsed());
    }
    @Test void finiteAttemptLimitBlocksNewAttempt() {
        used = limit; assertEquals("ATTEMPT_LIMIT_REACHED", result().blockedReason());
    }
    @Test void inProgressAtAttemptLimitCanResumeWithoutStartingAgain() {
        used = limit; attemptStatus = "IN_PROGRESS"; started = now.minusMinutes(5);
        assertTrue(result().canResume()); assertFalse(result().canStart());
    }
    @Test void expiredInProgressAttemptCannotResume() {
        attemptStatus = "IN_PROGRESS"; started = now.minusMinutes(45);
        assertEquals("TIME_EXPIRED", result().blockedReason());
    }
    @Test void pageUsesOneClassBatchForOneHundredRowsAndEscapesSearch() {
        var page = service().list("student", 2, 100, " A%_! ", 3L, LocalDate.of(2026, 10, 13), "newest");
        assertEquals(100, page.items().size()); assertEquals(100, page.totalElements());
        assertEquals(List.of("user", "page", "classes", "count", "stats"), calls);
        assertEquals(21L, parameters.getValue("studentId"));
        assertEquals(200L, parameters.getValue("offset"));
        assertEquals("%a!%!_!!%", parameters.getValue("pattern"));
        assertEquals(now.toLocalDate().atStartOfDay(), parameters.getValue("dayStart"));
    }
    @Test void emptyPageStillReturnsCountAndStats() {
        rows = 0;
        var result = service().list("student", 0, 20, null, null, null, "newest");
        assertTrue(result.items().isEmpty()); assertEquals(100, result.totalElements());
        assertEquals(7, result.stats().pendingGradingCount());
    }
    @Test void invalidPaginationAndSortDoNotQuery() {
        var service = service();
        assertThrows(IllegalArgumentException.class, () -> service.list("student", -1, 20, null, null, null, "newest"));
        assertThrows(IllegalArgumentException.class, () -> service.list("student", 0, 101, null, null, null, "newest"));
        assertThrows(IllegalArgumentException.class, () -> service.list("student", 0, 20, null, null, null, "sql"));
        assertTrue(calls.isEmpty());
    }
    @Test void teacherCannotReadStudentList() {
        role = UserRole.TEACHER;
        assertThrows(IllegalStateException.class, () -> service().list("teacher", 0, 20, null, null, null, "newest"));
        assertEquals(List.of("user"), calls);
    }
    @Test void foreignOrDraftAssignmentReturnsNotFoundWithoutClassRead() {
        accessible = false;
        assertThrows(ResourceNotFoundException.class, () -> service().detail("student", 12L));
        assertEquals(List.of("user", "detail"), calls);
    }
    private StudentExamResponse result() { return StudentExamReadService.response(row(), List.of(), now); }
    private StudentExamReadRepository.Row row() {
        return new StudentExamReadRepository.Row(12L, 5L, "Title", "EX-11-ABCDEF", "Description",
                examStatus, assignmentStatus, "STUDENT", open, close, 45, limit, used,
                "NOT_STARTED".equals(attemptStatus) ? null : 9L, attemptStatus, started);
    }
    private StudentExamReadService service() {
        var users = (UserRepository) Proxy.newProxyInstance(UserRepository.class.getClassLoader(), new Class<?>[]{UserRepository.class},
                (p,m,a) -> { calls.add("user"); return Optional.of(User.builder().id(21L).role(role).status(UserStatus.ACTIVE).build()); });
        var repository = new StudentExamReadRepository(null) {
            @Override public List<Row> findPage(MapSqlParameterSource params, String sort) {
                calls.add("page"); parameters = params; return Collections.nCopies(rows, row());
            }
            @Override public long countFiltered(MapSqlParameterSource params) { calls.add("count"); return 100; }
            @Override public StudentExamResponse.Stats stats(long id) { calls.add("stats"); return new StudentExamResponse.Stats(5, 10, 7); }
            @Override public Optional<Row> findAccessible(long assignmentId, long studentId) {
                calls.add("detail"); assertEquals(21L, studentId); return accessible ? Optional.of(row()) : Optional.empty();
            }
            @Override public Map<Long,List<StudentExamResponse.ClassInfo>> findClasses(List<Long> ids, long studentId) {
                calls.add("classes"); assertEquals(21L, studentId); return Map.of();
            }
        };
        return new StudentExamReadService(users, repository);
    }
}
