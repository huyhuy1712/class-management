package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.dto.exam.*;
import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.exception.*;
import com.classmanagement.backend.repository.exam.*;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class ExamPublishServiceTest {
    private final User teacher = User.builder().id(11L).role(UserRole.TEACHER).status(UserStatus.ACTIVE).build();
    private final Exam exam = Exam.builder().id(5L).teacher(teacher).subject(Subject.builder().id(1L).build())
            .status(ExamStatus.DRAFT).maxScore(BigDecimal.ONE).revision(0L).code("EX-11-ABCDEF").build();
    private final ExamAssignment assignment = ExamAssignment.builder().id(12L).exam(exam)
            .status(ExamAssignmentStatus.DRAFT).assignmentType(ExamAssignmentType.ALL).build();
    private final List<String> calls = new ArrayList<>();
    private boolean missing, hasAttempts, invalidContent, targetFails;

    @Test void publishesExamAndOpensAssignmentAfterValidation() {
        var response = service().publish(5L, "teacher");
        assertEquals(ExamStatus.PUBLISHED, response.status());
        assertEquals(ExamAssignmentStatus.OPEN, response.assignments().getFirst().status());
        assertTrue(calls.indexOf("targets") < calls.indexOf("flush"));
        assertEquals(1, Collections.frequency(calls, "detail"));
    }
    @Test void futureOpeningPublishesAsScheduled() {
        assignment.setOpenTime(LocalDateTime.now().plusYears(1));
        service().publish(5L, "teacher");
        assertEquals(ExamAssignmentStatus.SCHEDULED, assignment.getStatus());
    }
    @Test void expiredClosingFailsBeforeStatusMutation() {
        assignment.setCloseTime(LocalDateTime.of(2000, 1, 1, 0, 0));
        assertThrows(ExamValidationException.class, () -> service().publish(5L, "teacher"));
        assertEquals(ExamStatus.DRAFT, exam.getStatus()); assertFalse(calls.contains("flush"));
    }
    @Test void invalidContentCannotPublish() {
        invalidContent = true;
        assertThrows(ExamValidationException.class, () -> service().publish(5L, "teacher"));
        assertEquals(ExamAssignmentStatus.DRAFT, assignment.getStatus()); assertFalse(calls.contains("flush"));
    }
    @Test void invalidTargetsCannotPublishAnyAssignment() {
        targetFails = true;
        assertThrows(ExamValidationException.class, () -> service().publish(5L, "teacher"));
        assertEquals(ExamStatus.DRAFT, exam.getStatus()); assertEquals(ExamAssignmentStatus.DRAFT, assignment.getStatus());
    }
    @Test void repeatedPublishDoesNotReopenAssignmentOrReloadContent() {
        exam.setStatus(ExamStatus.PUBLISHED); assignment.setStatus(ExamAssignmentStatus.CLOSED);
        var response = service().publish(5L, "teacher");
        assertEquals(ExamAssignmentStatus.CLOSED, response.assignments().getFirst().status());
        assertFalse(calls.contains("detail")); assertFalse(calls.contains("flush"));
    }
    @Test void foreignExamIsNotFound() {
        missing = true;
        assertThrows(ResourceNotFoundException.class, () -> service().publish(5L, "other"));
        assertEquals(List.of("findLockedByIdAndTeacher_Username"), calls);
    }
    @Test void inactiveTeacherCannotPublish() {
        teacher.setRole(UserRole.STUDENT);
        assertThrows(IllegalStateException.class, () -> service().publish(5L, "teacher"));
        assertFalse(calls.contains("detail"));
    }
    @Test void closedExamOrExistingAttemptsCannotPublish() {
        exam.setStatus(ExamStatus.CLOSED);
        assertThrows(ConflictException.class, () -> service().publish(5L, "teacher"));
        exam.setStatus(ExamStatus.DRAFT); hasAttempts = true;
        assertThrows(ConflictException.class, () -> service().publish(5L, "teacher"));
    }
    @Test void unpublishResetsExamAndAllAssignmentsWithoutContentRead() {
        exam.setStatus(ExamStatus.PUBLISHED); assignment.setStatus(ExamAssignmentStatus.SCHEDULED);
        var openTime = LocalDateTime.now().plusDays(1); assignment.setOpenTime(openTime);
        var result = service().unpublish(5L, "teacher");
        assertEquals(ExamStatus.DRAFT, result.status());
        assertEquals(ExamAssignmentStatus.DRAFT, result.assignments().getFirst().status());
        assertEquals(openTime, assignment.getOpenTime());
        assertFalse(calls.contains("detail")); assertFalse(calls.contains("targets"));
        assertEquals(1, Collections.frequency(calls, "flush"));
    }
    @Test void unpublishWithAttemptFailsWithoutMutatingStatuses() {
        exam.setStatus(ExamStatus.PUBLISHED); assignment.setStatus(ExamAssignmentStatus.OPEN); hasAttempts = true;
        assertThrows(ConflictException.class, () -> service().unpublish(5L, "teacher"));
        assertEquals(ExamStatus.PUBLISHED, exam.getStatus());
        assertEquals(ExamAssignmentStatus.OPEN, assignment.getStatus()); assertFalse(calls.contains("flush"));
    }
    @Test void repeatedUnpublishIsNoOp() {
        var result = service().unpublish(5L, "teacher");
        assertEquals(ExamStatus.DRAFT, result.status()); assertFalse(calls.contains("flush"));
    }
    @Test void closedExamCannotBeUnpublished() {
        exam.setStatus(ExamStatus.CLOSED);
        assertThrows(ConflictException.class, () -> service().unpublish(5L, "teacher"));
        assertFalse(calls.contains("flush"));
    }
    @Test void foreignExamCannotBeUnpublished() {
        missing = true;
        assertThrows(ResourceNotFoundException.class, () -> service().unpublish(5L, "other"));
        assertEquals(List.of("findLockedByIdAndTeacher_Username"), calls);
    }
    @Test void wrongRoleCannotUnpublish() {
        teacher.setRole(UserRole.STUDENT);
        assertThrows(IllegalStateException.class, () -> service().unpublish(5L, "teacher"));
        assertFalse(calls.contains("flush"));
    }
    @Test void invalidIdDoesNotQuery() {
        assertThrows(IllegalArgumentException.class, () -> service().unpublish(0L, "teacher"));
        assertTrue(calls.isEmpty());
    }
    private ExamPublishService service() {
        var validator = Validation.buildDefaultValidatorFactory().getValidator();
        var detail = new ExamDetailService(null, null, null, null, null, null, null, null) {
            @Override public ExamDetailResponse get(Long id, String username) { calls.add("detail"); return detail(); }
        };
        var targets = new ExamTargetValidator(null, null, null) {
            @Override public void validateForPublication(Long id, List<ExamConfigurationResponse.Assignment> items) {
                calls.add("targets"); if (targetFails) throw new ExamValidationException(Map.of("assignments", "Invalid"));
            }
        };
        return new ExamPublishService(repo(ExamRepository.class), repo(ExamAssignmentRepository.class),
                repo(ExamAttemptRepository.class), detail, new ExamStructureValidator(validator), targets, validator,
                new ExamAttemptDataRepository(null) {
                    @Override public void snapshot(Long id) { calls.add("snapshot"); }
                    @Override public void clearCohort(Long id) { calls.add("clearCohort"); }
                });
    }
    private ExamDetailResponse detail() {
        var answer = new ExamDetailResponse.Answer(1L, 0, AnswerType.ESSAY, "Write", BigDecimal.ONE,
                ScoringType.PER_ANSWER, null, null, false, null, null, List.of(), List.of());
        var question = new ExamDetailResponse.Question(1L, 0, "Explain", null, BigDecimal.ONE, null, null, List.of(answer));
        var section = new ExamDetailResponse.Section(1L, 0, "Part 1", null, BigDecimal.ONE, null, null, List.of(question));
        var config = new ExamConfigurationResponse.Assignment(12L, ExamAssignmentStatus.DRAFT, ExamAssignmentType.ALL,
                List.of(), List.of(), null, null, ScoreVisibility.NEVER, AnswerVisibility.NEVER, null, false,
                assignment.getOpenTime(), assignment.getCloseTime(), null, List.of());
        return new ExamDetailResponse(5L, exam.getCode(), exam.getStatus(), BigDecimal.ONE, null,
                new ExamConfigurationResponse.BasicInfo("Exam", 1L, "Math", "12", null, null, 45, 1),
                List.of(config), invalidContent ? List.of() : List.of(section), 0L);
    }
    private <T> T repo(Class<T> type) {
        return type.cast(Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, (p,m,a) -> {
            calls.add(m.getName());
            return switch (m.getName()) {
                case "findLockedByIdAndTeacher_Username" -> missing ? Optional.empty() : Optional.of(exam);
                case "findAllByExam_Id" -> List.of(assignment);
                case "existsByAssignment_Exam_Id" -> hasAttempts;
                case "flush" -> null;
                default -> throw new AssertionError(m.getName());
            };
        }));
    }
}
