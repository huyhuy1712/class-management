package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.compositeID.*;
import com.classmanagement.backend.repository.exam.*;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Proxy;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class ExamConfigurationServiceTest {
    private final List<String> calls = new ArrayList<>();
    private List<ExamAssignment> assignments = List.of();
    private String owner = "teacher";

    @Test void rejectsOtherOwnerBeforeReadingTargets() {
        assertThrows(ResourceNotFoundException.class, () -> service().get(7L, "other"));
        assertEquals(List.of("findByIdAndTeacher_Username"), calls);
    }

    @Test void validatesIdBeforeQuerying() {
        assertThrows(IllegalArgumentException.class, () -> service().get(0L, owner));
        assertTrue(calls.isEmpty());
    }

    @Test void noAssignmentSkipsTargetQueriesAndPreservesNullSubject() {
        var response = service().get(7L, owner);
        assertTrue(response.assignments().isEmpty());
        assertNull(response.basicInfo().subjectId());
        assertEquals(0, response.basicInfo().maxAttempts());
        assertEquals(2, calls.size());
    }

    @Test void batchesOneHundredAssignmentsAndUsesCompositeTargetIds() {
        assignments = java.util.stream.LongStream.rangeClosed(1, 100)
                .mapToObj(id -> ExamAssignment.builder().id(id).build()).toList();
        var response = service().get(7L, owner);
        assertEquals(100, response.assignments().size());
        assertEquals(4, calls.size());
        assertEquals(List.of(12L, 13L), response.assignments().getFirst().classIds());
        assertEquals(List.of(22L), response.assignments().getFirst().studentIds());
        assertTrue(response.assignments().getLast().classIds().isEmpty());
        assertNull(response.assignments().getFirst().timeLimit());
    }

    private ExamConfigurationService service() {
        return new ExamConfigurationService(repository(ExamRepository.class),
                repository(ExamAssignmentRepository.class), repository(ExamAssignmentClassRepository.class),
                repository(ExamAssignmentStudentRepository.class));
    }

    private <T> T repository(Class<T> type) {
        return type.cast(Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, (proxy, method, args) -> {
            calls.add(method.getName());
            if (method.getName().equals("findByIdAndTeacher_Username")) {
                assertEquals(7L, args[0]);
                return owner.equals(args[1]) ? Optional.of(Exam.builder().id(7L).maxAttempts(0).build()) : Optional.empty();
            }
            if (method.getName().equals("findAllByExam_Id")) return assignments;
            if (method.getName().equals("findAllByAssignment_IdIn")) {
                assertEquals(100, ((Collection<?>) args[0]).size());
                if (type == ExamAssignmentClassRepository.class) return List.of(
                        ExamAssignmentClass.builder().id(new ExamAssignmentClassId(1L, 13L)).build(),
                        ExamAssignmentClass.builder().id(new ExamAssignmentClassId(1L, 12L)).build());
                return List.of(ExamAssignmentStudent.builder().id(new ExamAssignmentStudentId(1L, 22L)).build());
            }
            throw new AssertionError("Unexpected repository call: " + method.getName());
        }));
    }
}
