package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.dto.exam.UpdateExamContentRequest;
import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.exception.*;
import com.classmanagement.backend.repository.exam.*;
import jakarta.persistence.EntityManager;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class ExamContentUpdateServiceTest {
    private static final Validator VALIDATOR = Validation.buildDefaultValidatorFactory().getValidator();
    private final List<String> calls = new ArrayList<>();
    private final User teacher = User.builder().id(11L).role(UserRole.TEACHER).status(UserStatus.ACTIVE).build();
    private final Exam exam = Exam.builder().id(7L).teacher(teacher).status(ExamStatus.DRAFT).revision(0L)
            .maxScore(BigDecimal.ONE).code("EX-11-ABCDEF").build();
    private final ExamSection section = ExamSection.builder().id(1L).exam(exam).title("Section").orderIndex(1).points(BigDecimal.ONE).build();
    private List<Question> questions = new ArrayList<>();
    private List<Answer> answers = new ArrayList<>();
    private List<ExamMedia> media = List.of();
    private boolean attempts, wrongOwner, failPersist;
    private long nextId = 1000;
    private BigDecimal threshold;

    ExamContentUpdateServiceTest() { addQuestion(2L, 3L, 1); }
    private void addQuestion(long questionId, long answerId, int order) {
        var q = Question.builder().id(questionId).section(section).orderIndex(order).content("Question").points(BigDecimal.ONE).build();
        questions.add(q);
        answers.add(Answer.builder().id(answerId).question(q).orderIndex(1).answerType(AnswerType.ESSAY)
                .scoringType(ScoringType.PER_ANSWER).points(BigDecimal.ONE).caseSensitive(false).build());
    }
    private UpdateExamContentRequest.Question input(Long id, Long answerId) {
        return new UpdateExamContentRequest.Question(id, id == null ? "new-question" : null, "Question", null, null,
                BigDecimal.ONE, List.of(new UpdateExamContentRequest.Answer(answerId, answerId == null ? "new-answer" : null,
                AnswerType.ESSAY, null, null, null, BigDecimal.ONE, ScoringType.PER_ANSWER, null, false, List.of(), List.of())));
    }
    private UpdateExamContentRequest request(Long revision, List<UpdateExamContentRequest.Question> items, UUID image) {
        return new UpdateExamContentRequest(revision, null, List.of(new UpdateExamContentRequest.Section(1L, null,
                "Section", null, image, null, items)));
    }
    @Test void retainsExistingIdsAndReadsNineGroups() {
        var response = service().update(7L, "teacher", request(0L, List.of(input(2L, 3L)), null));
        assertEquals(1L, response.revision()); assertEquals(BigDecimal.ONE.setScale(2), response.maxScore());
        assertTrue(response.idMappings().questions().isEmpty());
        assertFalse(calls.contains("persist")); assertFalse(calls.contains("deleteAllByIdInBatch"));
        assertEquals(9, calls.stream().filter(c -> c.startsWith("find") || c.startsWith("exists")).count());
    }
    @Test void oneHundredQuestionsUseSameReadCount() {
        questions.clear(); answers.clear();
        List<UpdateExamContentRequest.Question> inputs = new ArrayList<>();
        for (int i = 1; i <= 100; i++) { addQuestion(i + 1L, i + 101L, i); inputs.add(input(i + 1L, i + 101L)); }
        service().update(7L, "teacher", request(0L, inputs, null));
        assertEquals(9, calls.stream().filter(c -> c.startsWith("find") || c.startsWith("exists")).count());
    }
    @Test void addsNodesReturnsMappingAndBulkDeletesRemovedNodes() {
        var response = service().update(7L, "teacher", request(0L, List.of(input(null, null)), null));
        assertEquals("new-question", response.idMappings().questions().getFirst().clientId());
        assertNotNull(response.idMappings().answers().getFirst().id());
        assertEquals(2, Collections.frequency(calls, "persist"));
        assertEquals(2, Collections.frequency(calls, "deleteAllByIdInBatch"));
    }
    @Test void reorderingFlushesTemporaryPositionsBeforeNewIdentityInsert() {
        service().update(7L, "teacher", request(0L, List.of(input(null, null), input(2L, 3L)), null));
        assertTrue(calls.indexOf("flush") < calls.indexOf("persist"));
        assertEquals(2, questions.getFirst().getOrderIndex());
    }
    @Test void staleRevisionStopsTreeReadsAndWrites() {
        assertThrows(ConflictException.class, () -> service().update(7L, "teacher", request(1L, List.of(input(2L, 3L)), null)));
        assertFalse(calls.contains("findAllByExam_IdOrderByOrderIndexAsc"));
    }
    @Test void publishedCannotWrite() {
        exam.setStatus(ExamStatus.PUBLISHED);
        assertThrows(ConflictException.class, () -> service().update(7L, "teacher", request(0L, List.of(input(2L, 3L)), null)));
        assertFalse(calls.contains("persist"));
    }
    @Test void attemptsCannotWrite() {
        attempts = true;
        assertThrows(ConflictException.class, () -> service().update(7L, "teacher", request(0L, List.of(input(2L, 3L)), null)));
    }
    @Test void wrongOwnerCannotReadTree() {
        wrongOwner = true;
        assertThrows(ResourceNotFoundException.class, () -> service().update(7L, "other", request(0L, List.of(input(2L, 3L)), null)));
        assertFalse(calls.contains("findAllByExam_IdOrderByOrderIndexAsc"));
    }
    @Test void foreignQuestionIdFailsBeforeWrites() {
        assertThrows(ExamValidationException.class, () -> service().update(7L, "teacher", request(0L, List.of(input(999L, 3L)), null)));
        assertFalse(calls.contains("persist")); assertFalse(calls.contains("deleteAllByIdInBatch"));
    }
    @Test void rejectsScoreBelowAssignmentThreshold() {
        threshold = BigDecimal.TEN;
        assertThrows(ExamValidationException.class, () -> service().update(7L, "teacher", request(0L, List.of(input(2L, 3L)), null)));
        assertFalse(calls.contains("findAllByExam_IdOrderByOrderIndexAsc"));
    }
    private void mediaFixture() {
        media = List.of(ExamMedia.builder().id(UUID.randomUUID()).teacher(teacher).exam(exam).status(ExamMediaStatus.ATTACHED)
                .mediaType(ExamMediaType.IMAGE).objectPath("stable/image.png").expiresAt(LocalDateTime.now().plusHours(1)).build());
    }
    @Test void keepsMediaStillReferencedByNewTree() {
        mediaFixture();
        service().update(7L, "teacher", request(0L, List.of(input(2L, 3L)), media.getFirst().getId()));
        assertFalse(calls.contains("queueUnusedByExamId")); assertEquals("stable/image.png", section.getImageUrl());
    }
    @Test void queuesOnlyMediaNoLongerReferenced() {
        mediaFixture();
        service().update(7L, "teacher", request(0L, List.of(input(2L, 3L)), null));
        assertTrue(calls.contains("queueUnusedByExamId"));
    }
    @Test void writeFailureInvokesRollbackWithoutReturningMapping() {
        failPersist = true;
        var transactions = new org.springframework.transaction.support.AbstractPlatformTransactionManager() {
            protected Object doGetTransaction() { return new Object(); }
            protected void doBegin(Object tx, org.springframework.transaction.TransactionDefinition def) {}
            protected void doCommit(org.springframework.transaction.support.DefaultTransactionStatus status) { calls.add("commit"); }
            protected void doRollback(org.springframework.transaction.support.DefaultTransactionStatus status) { calls.add("rollback"); }
        };
        var advice = new org.springframework.transaction.interceptor.TransactionInterceptor();
        advice.setTransactionManager(transactions);
        advice.setTransactionAttributeSource(new org.springframework.transaction.annotation.AnnotationTransactionAttributeSource());
        var factory = new org.springframework.aop.framework.ProxyFactory(service()); factory.setProxyTargetClass(true); factory.addAdvice(advice);
        var proxy = (ExamContentUpdateService) factory.getProxy();
        assertThrows(IllegalStateException.class, () -> proxy.update(7L, "teacher", request(0L, List.of(input(null, null)), null)));
        assertTrue(calls.contains("rollback")); assertFalse(calls.contains("commit"));
    }
    private ExamContentUpdateService service() {
        var sections = repo(ExamSectionRepository.class); var questionRepo = repo(QuestionRepository.class);
        var answerRepo = repo(AnswerRepository.class); var options = repo(AnswerOptionRepository.class); var rules = repo(QuestionScoringRuleRepository.class);
        var mediaRepo = repo(ExamMediaRepository.class);
        return new ExamContentUpdateService(repo(ExamRepository.class), repo(ExamAttemptRepository.class), repo(ExamAssignmentRepository.class),
                sections, questionRepo, answerRepo, options, rules, mediaRepo, new ExamMediaLifecycle(mediaRepo, null, 24),
                new ExamStructureValidator(VALIDATOR), new ExamContentWriter(repo(EntityManager.class), sections, questionRepo, answerRepo, options, rules), VALIDATOR);
    }
    private <T> T repo(Class<T> type) {
        return type.cast(Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, (proxy, method, args) -> {
            calls.add(method.getName());
            return switch (method.getName()) {
                case "findLockedByIdAndTeacher_Username" -> wrongOwner ? Optional.empty() : Optional.of(exam);
                case "existsByAssignment_Exam_Id" -> attempts;
                case "findAllByExam_Id" -> List.of(ExamAssignment.builder().answerVisibilityScore(threshold).build());
                case "findAllByExam_IdOrderByOrderIndexAsc" -> List.of(section);
                case "findAllBySection_IdInOrderBySection_IdAscOrderIndexAsc" -> questions;
                case "findAllByQuestion_IdInOrderByQuestion_IdAscOrderIndexAsc" -> answers;
                case "findAllByAnswer_IdInOrderByAnswer_IdAscOrderIndexAsc", "findAllByAnswer_IdInOrderByAnswer_IdAscCorrectCountAsc" -> List.of();
                case "findAllByExam_IdAndStatus", "findAllLockedByIds" -> media;
                case "queueUnusedByExamId" -> { assertEquals(Set.of(media.getFirst().getId()), args[1]); yield 1; }
                case "persist" -> {
                    if (failPersist) throw new IllegalStateException("write failed");
                    args[0].getClass().getMethod("setId", Long.class).invoke(args[0], nextId++); yield null;
                }
                // Emulates revision generation; actual Hibernate/PostgreSQL still needs integration verification.
                case "flush" -> { if (type == ExamRepository.class) exam.setRevision(exam.getRevision() + 1); yield null; }
                case "deleteAllByIdInBatch" -> null;
                default -> throw new AssertionError(method.getName());
            };
        }));
    }
}
