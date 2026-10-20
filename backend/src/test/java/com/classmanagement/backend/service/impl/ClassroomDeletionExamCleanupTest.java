package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.entity.ClassJoinRequestDetail;
import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.repository.classroom.ClassroomRepository;
import com.classmanagement.backend.repository.exam.ExamAssignmentClassRepository;
import com.classmanagement.backend.repository.request.ClassJoinRequestDetailRepository;
import com.classmanagement.backend.repository.request.RequestRepository;
import com.classmanagement.backend.service.MaterialService;
import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Query;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ClassroomDeletionExamCleanupTest {

    private final List<String> calls = new ArrayList<>();
    private final Classroom classroom = Classroom.builder().id(3L).build();

    @Test
    void cleansRelatedAssignmentsBeforeDeletingClass() {
        service().deleteClassroom(3L);

        assertEquals(
                List.of(
                        "classroom.findById",
                        "details.findAllByClassroomId",
                        "details.deleteAll",
                        "details.flush",
                        "requests.deleteAllById",
                        "assignments.deleteAssignmentsAndResetExamsForDeletedClass",
                        "classroom.delete"),
                calls);
    }

    @Test
    void cleanupQueryDeletesAssignmentsAndResetsExam() throws Exception {
        Query query = ExamAssignmentClassRepository.class
                .getMethod("deleteAssignmentsAndResetExamsForDeletedClass", Long.class)
                .getAnnotation(Query.class);
        String sql = query.value().replaceAll("\\s+", " ").toLowerCase();

        assertTrue(sql.contains("affected_exams as materialized"));
        assertTrue(sql.contains("a.assignment_type = 'student'"));
        assertTrue(sql.contains("a.assignment_type = 'all'"));
        assertTrue(sql.contains("from class_students cs"));
        assertTrue(sql.contains("c.teacher_id = e.teacher_id"));
        assertTrue(sql.contains("delete from exam_assignments a"));
        assertTrue(sql.contains("update exams e set status = 'draft'"));
    }

    @Test
    void studentRemovalDeletesOnlyThatStudentsClassScopedExamData() throws Exception {
        Query query = ExamAssignmentClassRepository.class
                .getMethod("deleteStudentExamDataForClass", Long.class, Long.class)
                .getAnnotation(Query.class);
        String sql = query.value().replaceAll("\\s+", " ").toLowerCase();

        assertTrue(sql.contains("class_students_in_scope as materialized"));
        assertTrue(sql.contains("attempt.student_id = student.student_id"));
        assertTrue(sql.contains("cohort.student_id = student.student_id"));
        assertTrue(sql.contains("a.assignment_type = 'all'"));
        assertTrue(sql.contains("a.assignment_type = 'class'"));
        assertTrue(sql.contains("a.assignment_type = 'student'"));
        assertTrue(sql.contains("target.class_id = :classroomid"));
        assertTrue(sql.contains("delete from exam_attempts"));
        assertTrue(sql.contains("delete from exam_assignment_completion_students"));
        assertTrue(sql.contains("delete from exam_assignment_students"));
        assertFalse(sql.contains("update exams"));
        assertFalse(sql.contains("delete from exam_assignments"));
    }

    private ClassroomServiceImpl service() {
        return new ClassroomServiceImpl(
                repository(ClassroomRepository.class, "classroom"),
                null,
                null,
                null,
                repository(ExamAssignmentClassRepository.class, "assignments"),
                repository(ClassJoinRequestDetailRepository.class, "details"),
                repository(RequestRepository.class, "requests"),
                null,
                null,
                null,
                org.mockito.Mockito.mock(MaterialService.class));
    }

    private <T> T repository(Class<T> type, String name) {
        return type.cast(Proxy.newProxyInstance(
                type.getClassLoader(),
                new Class<?>[] {type},
                (proxy, method, arguments) -> {
                    calls.add(name + "." + method.getName());

                    return switch (method.getName()) {
                        case "findById" -> Optional.of(classroom);
                        case "findAllByClassroomId" -> List.<ClassJoinRequestDetail>of();
                        case "delete" -> {
                            assertSame(classroom, arguments[0]);
                            yield null;
                        }
                        case "deleteAll", "flush", "deleteAllById" -> null;
                        case "deleteAssignmentsAndResetExamsForDeletedClass" -> 0;
                        default -> throw new AssertionError(method.getName());
                    };
                }));
    }
}
