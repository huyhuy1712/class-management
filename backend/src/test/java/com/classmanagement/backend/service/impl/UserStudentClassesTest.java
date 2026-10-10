package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.ClassroomStatus;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import com.classmanagement.backend.repository.projection.ClassroomSummaryProjection;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Proxy;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class UserStudentClassesTest {
    private UserRole role = UserRole.STUDENT;
    private boolean missing;
    private int classCount = 1;
    private final List<String> calls = new ArrayList<>();

    @Test void returnsClassFieldsIncludingArchivedClassesWithTwoReads() {
        var classes = service().getMyStudentClasses("student");
        assertEquals(1, classes.size());
        assertEquals("Toán", classes.getFirst().getSubjectName());
        assertEquals("Teacher", classes.getFirst().getTeacherName());
        assertEquals(ClassroomStatus.ARCHIVED, classes.getFirst().getStatus());
        assertEquals(List.of("findByUsername", "findClassSummariesByStudentId"), calls);
    }
    @Test void rejectsTeacherBeforeQueryingClasses() {
        role = UserRole.TEACHER;
        assertThrows(IllegalStateException.class, () -> service().getMyStudentClasses("student"));
        assertEquals(List.of("findByUsername"), calls);
    }
    @Test void returnsEmptyListWhenNotEnrolled() {
        classCount = 0;
        assertTrue(service().getMyStudentClasses("student").isEmpty());
        assertEquals(2, calls.size());
    }
    @Test void oneHundredClassesStillUseTwoReads() {
        classCount = 100;
        assertEquals(100, service().getMyStudentClasses("student").size());
        assertEquals(2, calls.size());
    }
    @Test void missingUserCannotQueryMemberships() {
        missing = true;
        assertThrows(IllegalArgumentException.class, () -> service().getMyStudentClasses("student"));
        assertEquals(1, calls.size());
    }
    private UserServiceImpl service() {
        return new UserServiceImpl(repo(UserRepository.class), repo(ClassStudentRepository.class), null, null, null);
    }
    private <T> T repo(Class<T> type) {
        return type.cast(Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, (proxy, method, args) -> {
            calls.add(method.getName());
            if (method.getName().equals("findByUsername")) {
                assertEquals("student", args[0]);
                return missing ? Optional.empty() : Optional.of(User.builder().id(12L).role(role).build());
            }
            if (method.getName().equals("findClassSummariesByStudentId")) {
                assertEquals(12L, args[0]);
                return java.util.stream.LongStream.rangeClosed(1, classCount).mapToObj(this::projection).toList();
            }
            throw new AssertionError(method.getName());
        }));
    }
    private ClassroomSummaryProjection projection(long id) {
        return (ClassroomSummaryProjection) Proxy.newProxyInstance(getClass().getClassLoader(),
                new Class<?>[]{ClassroomSummaryProjection.class}, (proxy, method, args) -> switch (method.getName()) {
                    case "getId" -> id;
                    case "getName" -> "Lớp Toán";
                    case "getCode" -> "MATH-12";
                    case "getSubjectId" -> 1L;
                    case "getSubjectName" -> "Toán";
                    case "getTeacherId" -> 11L;
                    case "getTeacherName" -> "Teacher";
                    case "getAcademicYear" -> "2026-2027";
                    case "getStatus" -> ClassroomStatus.ARCHIVED;
                    default -> null;
                });
    }
}
