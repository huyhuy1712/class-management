package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.dto.exam.*;
import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.compositeID.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.exception.*;
import com.classmanagement.backend.repository.SubjectRepository;
import com.classmanagement.backend.repository.exam.*;
import jakarta.persistence.EntityManager;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class ExamConfigurationUpdateServiceTest {
    private static final Validator VALIDATOR = Validation.buildDefaultValidatorFactory().getValidator();
    private final List<String> calls = new ArrayList<>();
    private final User teacher = User.builder().id(11L).role(UserRole.TEACHER).status(UserStatus.ACTIVE).build();
    private final Exam exam = Exam.builder().id(7L).teacher(teacher).status(ExamStatus.DRAFT)
            .title("old").code("EX-11-ABCDEF").maxScore(BigDecimal.TEN).build();
    private final ExamAssignment assignment = ExamAssignment.builder().id(8L).exam(exam)
            .status(ExamAssignmentStatus.DRAFT).timeLimit(5).maxAttempts(2).build();
    private boolean missing, attempts, persistFailure;

    @Test void updatesConfigurationAndOnlyChangedTargets() {
        service().update(7L, "teacher", request(AnswerVisibility.AFTER_SUBMIT, null));
        assertEquals("new title", exam.getTitle());
        assertEquals(60, exam.getTimeLimit()); assertEquals(0, exam.getMaxAttempts());
        assertEquals("EX-11-ABCDEF", exam.getCode()); assertEquals(BigDecimal.TEN, exam.getMaxScore());
        assertNull(assignment.getTimeLimit()); assertNull(assignment.getMaxAttempts());
        assertEquals(1, Collections.frequency(calls, "persist"));
        assertTrue(calls.indexOf("flush") < calls.indexOf("response"));
    }
    @Test void otherOwnerCannotWrite() {
        missing = true;
        assertThrows(ResourceNotFoundException.class, () -> service().update(7L, "teacher", request(AnswerVisibility.NEVER, null)));
        assertEquals("old", exam.getTitle()); assertFalse(calls.contains("persist"));
    }
    @Test void publishedExamCannotWrite() {
        exam.setStatus(ExamStatus.PUBLISHED);
        assertThrows(ConflictException.class, () -> service().update(7L, "teacher", request(AnswerVisibility.NEVER, null)));
        assertEquals("old", exam.getTitle());
    }
    @Test void attemptConflictCannotWrite() {
        attempts = true;
        assertThrows(ConflictException.class, () -> service().update(7L, "teacher", request(AnswerVisibility.NEVER, null)));
        assertEquals("old", exam.getTitle());
    }
    @Test void thresholdAboveScoreCannotWrite() {
        assertThrows(ExamValidationException.class, () -> service().update(7L, "teacher", request(AnswerVisibility.AFTER_SCORE, new BigDecimal("11"))));
        assertEquals("old", exam.getTitle());
    }
    @Test void missingThresholdUsesPutFieldPath() {
        var ex = assertThrows(ExamValidationException.class, () -> service().update(7L, "teacher", request(AnswerVisibility.AFTER_SCORE, null)));
        assertTrue(ex.getValidationErrors().containsKey("assignment.threshold"));
    }
    @Test void targetWriteFailureDoesNotReturnSuccess() {
        persistFailure = true;
        assertThrows(IllegalStateException.class, () -> service().update(7L, "teacher", request(AnswerVisibility.NEVER, null)));
        assertFalse(calls.contains("response"));
    }
    @Test void missingBasicInfoFailsBeforeQuery() {
        assertThrows(ExamValidationException.class, () -> service().update(7L, "teacher", new UpdateExamRequest(null, null)));
        assertTrue(calls.isEmpty());
    }
    @Test void targetFailureInvokesSpringTransactionRollback() {
        persistFailure = true;
        var transactions = new org.springframework.transaction.support.AbstractPlatformTransactionManager() {
            @Override protected Object doGetTransaction() { return new Object(); }
            @Override protected void doBegin(Object transaction, org.springframework.transaction.TransactionDefinition definition) {}
            @Override protected void doCommit(org.springframework.transaction.support.DefaultTransactionStatus status) { calls.add("commit"); }
            @Override protected void doRollback(org.springframework.transaction.support.DefaultTransactionStatus status) { calls.add("rollback"); }
        };
        var advice = new org.springframework.transaction.interceptor.TransactionInterceptor();
        advice.setTransactionManager(transactions);
        advice.setTransactionAttributeSource(new org.springframework.transaction.annotation.AnnotationTransactionAttributeSource());
        var factory = new org.springframework.aop.framework.ProxyFactory(service());
        factory.setProxyTargetClass(true); factory.addAdvice(advice);
        var proxy = (ExamConfigurationUpdateService) factory.getProxy();
        assertThrows(IllegalStateException.class, () -> proxy.update(7L, "teacher", request(AnswerVisibility.NEVER, null)));
        assertTrue(calls.contains("rollback")); assertFalse(calls.contains("commit"));
    }
    private UpdateExamRequest request(AnswerVisibility visibility, BigDecimal threshold) {
        return new UpdateExamRequest(new CreateCompleteExamRequest.BasicInfo(" new title ", 1L, "10", null, null, 60, 0),
                new UpdateExamRequest.Assignment(8L, ExamAssignmentType.CLASS, List.of(12L, 13L), List.of(),
                        ScoreVisibility.AFTER_SUBMIT, visibility, threshold, false, null, null));
    }
    private ExamConfigurationUpdateService service() {
        var targets = new ExamTargetValidator(null, null, null) {
            @Override public Targets validate(Long id, CreateCompleteExamRequest.Assignment input) {
                return new Targets(List.of(Classroom.builder().id(12L).build(), Classroom.builder().id(13L).build()), List.of());
            }
        };
        var config = new ExamConfigurationService(null, null, null, null) {
            @Override public ExamConfigurationResponse get(Long id, String username) { calls.add("response"); return null; }
        };
        return new ExamConfigurationUpdateService(repo(ExamRepository.class), repo(ExamAssignmentRepository.class),
                repo(ExamAttemptRepository.class), repo(ExamAssignmentClassRepository.class),
                repo(ExamAssignmentStudentRepository.class), repo(SubjectRepository.class),
                new ExamStructureValidator(VALIDATOR), targets, config, VALIDATOR, repo(EntityManager.class));
    }
    private <T> T repo(Class<T> type) {
        return type.cast(Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, (proxy, method, args) -> {
            calls.add(method.getName());
            return switch (method.getName()) {
                case "findLockedByIdAndTeacher_Username" -> missing ? Optional.empty() : Optional.of(exam);
                case "findLockedByIdAndExam_Id" -> { assertEquals(8L, args[0]); assertEquals(7L, args[1]); yield Optional.of(assignment); }
                case "existsByAssignment_Id" -> attempts;
                case "findById" -> Optional.of(Subject.builder().id(1L).build());
                case "findAllByAssignment_IdIn" -> type == ExamAssignmentClassRepository.class
                        ? List.of(ExamAssignmentClass.builder().id(new ExamAssignmentClassId(8L, 12L)).build(),
                                ExamAssignmentClass.builder().id(new ExamAssignmentClassId(8L, 14L)).build()) : List.of();
                case "deleteTargets" -> { assertEquals(Set.of(14L), args[1]); yield 1; }
                case "persist" -> {
                    assertEquals(13L, ((ExamAssignmentClass) args[0]).getId().getClassId());
                    if (persistFailure) throw new IllegalStateException("write failed"); yield null;
                }
                case "flush" -> null;
                default -> throw new AssertionError(method.getName());
            };
        }));
    }
}
