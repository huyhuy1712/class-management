package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.repository.classroom.*;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Proxy;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class ClassroomBulkRemovalTest {
    private final List<String> calls = new ArrayList<>();
    private int affected = 100;
    private boolean missing;
    private boolean fails;

    @Test void bulkRemovalUsesTwoCallsRegardlessOfClassSize() {
        service().removeAllStudentsFromClassroom(3L, "teacher");
        assertEquals(List.of("findByIdForUpdate", "removeAllAndNotify"), calls);
    }
    @Test void emptyClassAlsoSucceedsWithoutPerStudentWork() {
        affected = 0;
        service().removeAllStudentsFromClassroom(3L, "teacher");
        assertEquals(2, calls.size());
    }
    @Test void anotherTeacherCannotDeleteOrNotify() {
        assertThrows(IllegalStateException.class, () -> service().removeAllStudentsFromClassroom(3L, "other"));
        assertEquals(List.of("findByIdForUpdate"), calls);
    }
    @Test void missingClassDoesNotWrite() {
        missing = true;
        assertThrows(ResourceNotFoundException.class, () -> service().removeAllStudentsFromClassroom(3L, "teacher"));
        assertEquals(1, calls.size());
    }
    @Test void invalidIdDoesNotQuery() {
        assertThrows(IllegalArgumentException.class, () -> service().removeAllStudentsFromClassroom(0L, "teacher"));
        assertTrue(calls.isEmpty());
    }
    @Test void databaseFailurePropagatesForRollback() {
        fails = true;
        assertThrows(IllegalStateException.class, () -> service().removeAllStudentsFromClassroom(3L, "teacher"));
        assertEquals(2, calls.size());
    }
    private ClassroomServiceImpl service() {
        return new ClassroomServiceImpl(repo(ClassroomRepository.class), null, null,
                repo(ClassStudentRepository.class), null, null, null, null, null);
    }
    private <T> T repo(Class<T> type) {
        return type.cast(Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, (p, m, a) -> {
            calls.add(m.getName());
            return switch (m.getName()) {
                case "findByIdForUpdate" -> missing ? Optional.empty() : Optional.of(Classroom.builder()
                        .id(3L).name("Anh 12A5")
                        .teacher(User.builder().username("teacher").role(UserRole.TEACHER).build()).build());
                case "removeAllAndNotify" -> {
                    assertArrayEquals(new Object[]{3L, "Bạn đã bị xóa khỏi lớp Anh 12A5"}, a);
                    if (fails) throw new IllegalStateException("DB failure");
                    yield affected;
                }
                default -> throw new AssertionError(m.getName());
            };
        }));
    }
}
