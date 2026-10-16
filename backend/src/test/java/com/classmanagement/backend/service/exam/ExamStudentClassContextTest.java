package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.service.exam.configuration.ExamConfigurationUpdateService;
import com.classmanagement.backend.service.exam.validation.ExamStructureValidator;
import com.classmanagement.backend.service.exam.validation.ExamTargetValidator;

import com.classmanagement.backend.dto.exam.CreateCompleteExamRequest;
import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.classroom.*;
import com.classmanagement.backend.repository.exam.*;
import com.classmanagement.backend.entity.compositeID.ExamAssignmentStudentId;
import jakarta.persistence.EntityManager;
import com.classmanagement.backend.exception.ExamValidationException;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Proxy;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class ExamStudentClassContextTest {
    private final Classroom classroom = Classroom.builder().id(3L).status(ClassroomStatus.ACTIVE)
            .teacher(User.builder().id(11L).build()).build();
    private List<Long> members = List.of(21L, 22L);
    private int membershipReads;
    private int classBatchReads, studentBatchReads, pairReads;

    @Test void validatesAllStudentsWithOneMembershipQuery() {
        var targets = validator().validate(11L, assignment(3L));
        assertSame(classroom, targets.classroom());
        assertEquals(1, membershipReads);
    }
    @Test void omittedContextRemainsNullWithoutExtraMembershipQuery() {
        assertNull(validator().validate(11L, assignment(null)).classroom());
        assertEquals(0, membershipReads);
    }
    @Test void anotherTeachersContextIsRejected() {
        classroom.getTeacher().setId(12L);
        var exception = assertThrows(ExamValidationException.class, () -> validator().validate(11L, assignment(3L)));
        assertTrue(exception.getValidationErrors().containsKey("assignment.classId"));
        assertEquals(0, membershipReads);
    }
    @Test void archivedContextIsRejected() {
        classroom.setStatus(ClassroomStatus.ARCHIVED);
        assertThrows(ExamValidationException.class, () -> validator().validate(11L, assignment(3L)));
    }
    @Test void studentInOtherTeacherClassButNotSelectedContextIsRejected() {
        members = List.of(21L);
        var exception = assertThrows(ExamValidationException.class, () -> validator().validate(11L, assignment(3L)));
        assertTrue(exception.getValidationErrors().containsKey("assignment.studentIds"));
    }
    @Test void classContextIsForbiddenForClassAssignment() {
        var assignment = new CreateCompleteExamRequest.Assignment(ExamAssignmentType.CLASS, List.of(3L), List.of(),
                ScoreVisibility.NEVER, AnswerVisibility.NEVER, null, false, null, null, 3L);
        assertThrows(ExamValidationException.class,
                () -> new ExamStructureValidator(null).validateAssignment(assignment));
    }
    @Test void retainedStudentContextIsUpdatedWithoutPersistingAgain() throws Exception {
        verifySync(true, classroom);
    }
    @Test void retainedStudentContextCanBeCleared() throws Exception {
        verifySync(true, null);
    }
    @Test void newStudentIsPersistedWithContext() throws Exception {
        verifySync(false, classroom);
    }
    @Test void publicationOfOneHundredAssignmentsUsesSingleTargetBatches() {
        validator().validateForPublication(11L, Collections.nCopies(100, publicationAssignment()));
        assertEquals(1, classBatchReads); assertEquals(1, studentBatchReads); assertEquals(1, pairReads);
    }
    @Test void publicationRejectsStudentNoLongerInContext() {
        members = List.of(21L);
        assertThrows(ExamValidationException.class,
                () -> validator().validateForPublication(11L, List.of(publicationAssignment())));
    }
    private com.classmanagement.backend.dto.exam.ExamConfigurationResponse.Assignment publicationAssignment() {
        return new com.classmanagement.backend.dto.exam.ExamConfigurationResponse.Assignment(12L, ExamAssignmentStatus.DRAFT,
                ExamAssignmentType.STUDENT, List.of(), List.of(21L, 22L), null, null,
                ScoreVisibility.NEVER, AnswerVisibility.NEVER, null, false, null, null, null,
                List.of(new com.classmanagement.backend.dto.exam.ExamConfigurationResponse.StudentClassContext(21L, 3L),
                        new com.classmanagement.backend.dto.exam.ExamConfigurationResponse.StudentClassContext(22L, 3L)));
    }
    private void verifySync(boolean retained, Classroom context) throws Exception {
        var row = ExamAssignmentStudent.builder().id(new ExamAssignmentStudentId(8L, 21L))
                .classroom(Classroom.builder().id(99L).build()).build();
        List<ExamAssignmentStudent> persisted = new ArrayList<>();
        var classes = (ExamAssignmentClassRepository) Proxy.newProxyInstance(
                ExamAssignmentClassRepository.class.getClassLoader(), new Class<?>[]{ExamAssignmentClassRepository.class},
                (p,m,a) -> { assertEquals("findAllByAssignment_IdIn", m.getName()); return List.of(); });
        var students = (ExamAssignmentStudentRepository) Proxy.newProxyInstance(
                ExamAssignmentStudentRepository.class.getClassLoader(), new Class<?>[]{ExamAssignmentStudentRepository.class},
                (p,m,a) -> { assertEquals("findAllByAssignment_IdIn", m.getName()); return retained ? List.of(row) : List.of(); });
        var em = (EntityManager) Proxy.newProxyInstance(EntityManager.class.getClassLoader(), new Class<?>[]{EntityManager.class},
                (p,m,a) -> { assertEquals("persist", m.getName()); persisted.add((ExamAssignmentStudent)a[0]); return null; });
        var service = new ExamConfigurationUpdateService(null, null, null, classes, students, null,
                null, null, null, null, em, null);
        var sync = ExamConfigurationUpdateService.class.getDeclaredMethod("syncTargets", ExamAssignment.class, ExamTargetValidator.Targets.class);
        sync.setAccessible(true);
        sync.invoke(service, ExamAssignment.builder().id(8L).build(), new ExamTargetValidator.Targets(
                List.of(), List.of(User.builder().id(21L).build()), context));
        if (retained) { assertSame(context, row.getClassroom()); assertTrue(persisted.isEmpty()); }
        else { assertEquals(1, persisted.size()); assertSame(context, persisted.getFirst().getClassroom()); }
    }
    private CreateCompleteExamRequest.Assignment assignment(Long classId) {
        return new CreateCompleteExamRequest.Assignment(ExamAssignmentType.STUDENT, List.of(), List.of(21L, 22L),
                ScoreVisibility.NEVER, AnswerVisibility.NEVER, null, false, null, null, classId);
    }
    private ExamTargetValidator validator() {
        return new ExamTargetValidator(repo(ClassroomRepository.class), repo(ClassStudentRepository.class), repo(UserRepository.class));
    }
    private <T> T repo(Class<T> type) {
        return type.cast(Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, (p,m,a) -> switch(m.getName()) {
            case "findAllById" -> {
                if (type == ClassroomRepository.class) { classBatchReads++; yield List.of(classroom); }
                studentBatchReads++;
                yield List.of(User.builder().id(21L).role(UserRole.STUDENT).status(UserStatus.ACTIVE).build(),
                        User.builder().id(22L).role(UserRole.STUDENT).status(UserStatus.ACTIVE).build());
            }
            case "findAssignableStudentIds" -> List.of(21L, 22L);
            case "findById" -> Optional.of(classroom);
            case "findStudentIdsInClass" -> { assertArrayEquals(new Object[]{3L, List.of(21L, 22L)}, a); membershipReads++; yield members; }
            case "findStudentClassPairs" -> {
                pairReads++;
                yield members.stream().map(id -> new ClassStudentRepository.StudentClassPair() {
                    public Long getClassId() { return 3L; }
                    public Long getStudentId() { return id; }
                }).toList();
            }
            default -> throw new AssertionError(m.getName());
        }));
    }
}
