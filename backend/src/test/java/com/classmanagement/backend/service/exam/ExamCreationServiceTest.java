package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.dto.exam.CreateCompleteExamRequest;
import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.exception.*;
import com.classmanagement.backend.repository.*;
import com.classmanagement.backend.repository.classroom.*;
import com.classmanagement.backend.repository.exam.*;
import jakarta.persistence.EntityManager;
import jakarta.validation.Validation;
import org.hibernate.validator.messageinterpolation.ParameterMessageInterpolator;
import org.junit.jupiter.api.Test;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.AnnotationTransactionAttributeSource;
import org.springframework.transaction.interceptor.TransactionInterceptor;
import org.springframework.transaction.support.*;
import java.lang.reflect.Proxy;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static com.classmanagement.backend.service.exam.ExamStructureValidatorTest.*;

class ExamCreationServiceTest {
    private final User teacher = User.builder().id(1L).role(UserRole.TEACHER).status(UserStatus.ACTIVE).build();
    private final Map<String, Integer> calls = new HashMap<>();
    private final RecordingTransactions transactions = new RecordingTransactions();
    private boolean failQuestionInsert;
    private boolean duplicateCode;
    private int collisionsRemaining;
    private long nextId = 1;
    private List<Classroom> classes = List.of();
    private List<User> students = List.of();
    private List<Long> allowedStudents = List.of();

    @Test void happyPathCommitsAndReturnsDraft() {
        var response = service().create("teacher", request(List.of(choice(), trueFalse()), "3", assignment()));
        assertEquals(ExamStatus.DRAFT, response.status());
        assertTrue(response.code().matches("EX-1-[A-Z]{6}"));
        assertEquals(number("3.00"), response.maxScore());
        assertEquals(1, transactions.commits);
        assertEquals(0, transactions.rollbacks);
        assertEquals(1, calls.get("options.saveAll"));
    }

    @Test void childFailureTriggersTransactionRollback() {
        failQuestionInsert = true;
        assertThrows(IllegalStateException.class,
                () -> service().create("teacher", request(List.of(choice()), "1", assignment())));
        assertEquals(1, calls.get("exams.save"));
        assertEquals(1, calls.get("sections.saveAll"));
        assertEquals(1, transactions.rollbacks);
        assertEquals(0, transactions.commits);
    }

    @Test void validationFailureDoesNotInsertParent() {
        assertThrows(ExamValidationException.class,
                () -> service().create("teacher", request(List.of(choice()), "2", assignment())));
        assertFalse(calls.containsKey("exams.save"));
    }

    @Test void exhaustedCodeGenerationDoesNotInsertParent() {
        duplicateCode = true;
        assertThrows(ConflictException.class,
                () -> service().create("teacher", request(List.of(choice()), "1", assignment())));
        assertFalse(calls.containsKey("exams.save"));
        assertEquals(10, calls.get("exams.existsByTeacher_IdAndCode"));
    }

    @Test void regeneratesCodeWhenCandidateAlreadyExists() {
        collisionsRemaining = 1;
        var response = service().create("teacher", request(List.of(choice()), "1", assignment()));
        assertTrue(response.code().matches("EX-1-[A-Z]{6}"));
        assertEquals(2, calls.get("exams.existsByTeacher_IdAndCode"));
        assertEquals(1, transactions.commits);
    }

    @Test void rejectsAnotherTeachersClassBeforeInsert() {
        classes = List.of(Classroom.builder().id(2L).teacher(User.builder().id(2L).build())
                .status(ClassroomStatus.ACTIVE).build());
        var assignment = new CreateCompleteExamRequest.Assignment(ExamAssignmentType.CLASS, List.of(2L), null,
                ScoreVisibility.NEVER, AnswerVisibility.NEVER, null, false, null, null);
        assertThrows(ExamValidationException.class,
                () -> service().create("teacher", request(List.of(choice()), "1", assignment)));
        assertFalse(calls.containsKey("exams.save"));
    }

    @Test void studentTargetsUseBatchReadsAndPersistWithoutMerge() {
        students = List.of(User.builder().id(2L).role(UserRole.STUDENT).status(UserStatus.ACTIVE).build(),
                User.builder().id(3L).role(UserRole.STUDENT).status(UserStatus.ACTIVE).build());
        allowedStudents = List.of(2L,3L);
        var assignment = new CreateCompleteExamRequest.Assignment(ExamAssignmentType.STUDENT, null, List.of(2L,3L),
                ScoreVisibility.NEVER, AnswerVisibility.NEVER, null, false, null, null);
        service().create("teacher", request(List.of(choice()), "1", assignment));
        assertEquals(1, calls.get("users.findAllById"));
        assertEquals(1, calls.get("memberships.findAssignableStudentIds"));
        assertEquals(2, calls.get("entityManager.persist"));
    }

    @Test void readRepositoryCallsDoNotGrowWithQuestionCount() {
        var service = service();
        service.create("teacher", manyQuestions(10));
        int first = readCalls();
        calls.clear();
        service.create("teacher", manyQuestions(100));
        assertEquals(first, readCalls());
        assertEquals(1, calls.get("questions.saveAll"));
    }

    private int readCalls() {
        return calls.entrySet().stream().filter(e -> e.getKey().contains(".find") || e.getKey().contains(".exists"))
                .mapToInt(Map.Entry::getValue).sum();
    }
    private CreateCompleteExamRequest manyQuestions(int count) {
        var base = request(List.of(choice()), "1", assignment());
        var questions = java.util.stream.IntStream.range(0, count)
                .mapToObj(i -> new CreateCompleteExamRequest.Question("Câu " + i, null, null, number("1"), List.of(choice()))).toList();
        return new CreateCompleteExamRequest(base.basicInfo(), base.assignment(), null,
                List.of(new CreateCompleteExamRequest.Section("Phần 1", null, null, null, questions)));
    }

    private ExamCreationService service() {
        var factory = Validation.byDefaultProvider().configure()
                .messageInterpolator(new ParameterMessageInterpolator()).buildValidatorFactory();
        var validator = new ExamStructureValidator(factory.getValidator());
        UserRepository users = repository(UserRepository.class, "users");
        var lifecycle = new ExamMediaLifecycle(repository(ExamMediaRepository.class, "media"), users, 24);
        var target = new ExamCreationService(validator, lifecycle, users, repository(SubjectRepository.class, "subjects"),
                repository(ClassroomRepository.class, "classes"), repository(ClassStudentRepository.class, "memberships"),
                repository(ExamRepository.class, "exams"), repository(ExamAssignmentRepository.class, "assignments"),
                repository(ExamSectionRepository.class, "sections"), repository(QuestionRepository.class, "questions"),
                repository(AnswerRepository.class, "answers"), repository(AnswerOptionRepository.class, "options"),
                repository(QuestionScoringRuleRepository.class, "rules"), repository(EntityManager.class, "entityManager"));
        var interceptor = new TransactionInterceptor();
        interceptor.setTransactionManager(transactions);
        interceptor.setTransactionAttributeSource(new AnnotationTransactionAttributeSource());
        var proxy = new ProxyFactory(target);
        proxy.setProxyTargetClass(true);
        proxy.addAdvice(interceptor);
        return (ExamCreationService) proxy.getProxy();
    }

    private <T> T repository(Class<T> type, String label) {
        return type.cast(Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, (ignored, method, args) -> {
            String name = method.getName();
            calls.merge(label + "." + name, 1, Integer::sum);
            if (name.equals("findByUsername")) return Optional.of(teacher);
            if (name.equals("findById")) return Optional.of(Subject.builder().id(1L).build());
            if (name.equals("existsByTeacher_IdAndCode")) {
                assertEquals(teacher.getId(), args[0]);
                assertTrue(((String) args[1]).matches("EX-1-[A-Z]{6}"));
                if (collisionsRemaining > 0) { collisionsRemaining--; return true; }
                return duplicateCode;
            }
            if (name.equals("findAllById")) return label.equals("classes") ? classes : students;
            if (name.equals("findAssignableStudentIds")) return allowedStudents;
            if (name.equals("save")) { assignId(args[0]); return args[0]; }
            if (name.equals("saveAll")) {
                if (label.equals("questions") && failQuestionInsert) throw new IllegalStateException("Simulated child insert failure");
                for (Object entity : (Iterable<?>) args[0]) assignId(entity);
                return args[0];
            }
            return null;
        }));
    }
    private void assignId(Object entity) throws Exception {
        entity.getClass().getMethod("setId", Long.class).invoke(entity, nextId++);
    }
    // Verifies Spring transaction interception, not PostgreSQL persistence semantics.
    private static class RecordingTransactions extends AbstractPlatformTransactionManager {
        int commits, rollbacks;
        protected Object doGetTransaction() { return new Object(); }
        protected void doBegin(Object transaction, TransactionDefinition definition) {}
        protected void doCommit(DefaultTransactionStatus status) { commits++; }
        protected void doRollback(DefaultTransactionStatus status) { rollbacks++; }
    }
}
