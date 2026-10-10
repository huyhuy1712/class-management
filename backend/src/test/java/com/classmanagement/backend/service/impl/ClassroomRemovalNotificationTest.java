package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.repository.NotificationRepository;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Proxy;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class ClassroomRemovalNotificationTest {
    private final List<String> calls = new ArrayList<>();
    private boolean missing;
    private boolean deleteFails;
    private boolean notificationFails;
    private Notification notification;
    private final ClassStudent membership = ClassStudent.builder()
            .student(User.builder().id(21L).build())
            .classroom(Classroom.builder().id(3L).name("Anh 12A5")
                    .teacher(User.builder().role(UserRole.TEACHER).username("teacher").build()).build()).build();

    @Test void removalCreatesOneUnreadNotificationForStudentWithClassReference() {
        service().removeStudentFromClassroom(3L, 21L, "teacher");
        assertEquals(List.of("findMembershipForUpdate", "delete", "flush", "save"), calls);
        assertSame(membership.getStudent(), notification.getUser());
        assertEquals(NotificationType.CLASS_REMOVED, notification.getType());
        assertFalse(notification.isRead());
        assertEquals("CLASS", notification.getReferenceType());
        assertEquals(3L, notification.getReferenceId());
        assertEquals("Bạn đã bị xóa khỏi lớp Anh 12A5", notification.getMessage());
    }
    @Test void anotherTeacherCannotDeleteOrNotify() {
        assertThrows(IllegalStateException.class, () -> service().removeStudentFromClassroom(3L, 21L, "other"));
        assertEquals(List.of("findMembershipForUpdate"), calls);
    }
    @Test void missingMembershipDoesNotNotify() {
        missing = true;
        assertThrows(ResourceNotFoundException.class, () -> service().removeStudentFromClassroom(3L, 21L, "teacher"));
        assertEquals(List.of("findMembershipForUpdate"), calls);
    }
    @Test void invalidIdsDoNotQuery() {
        assertThrows(IllegalArgumentException.class, () -> service().removeStudentFromClassroom(0L, 21L, "teacher"));
        assertTrue(calls.isEmpty());
    }
    @Test void failedDeleteDoesNotNotify() {
        deleteFails = true;
        assertThrows(IllegalStateException.class, () -> service().removeStudentFromClassroom(3L, 21L, "teacher"));
        assertFalse(calls.contains("save"));
    }
    @Test void notificationFailurePropagatesForTransactionRollback() {
        notificationFails = true;
        assertThrows(IllegalStateException.class, () -> service().removeStudentFromClassroom(3L, 21L, "teacher"));
        assertEquals(List.of("findMembershipForUpdate", "delete", "flush", "save"), calls);
    }
    private ClassroomServiceImpl service() {
        return new ClassroomServiceImpl(null, null, null, repo(ClassStudentRepository.class),
                null, null, null, null, repo(NotificationRepository.class));
    }
    private <T> T repo(Class<T> type) {
        return type.cast(Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, (p, m, a) -> {
            calls.add(m.getName());
            return switch (m.getName()) {
                case "findMembershipForUpdate" -> {
                    assertArrayEquals(new Object[]{3L, 21L}, a);
                    yield missing ? Optional.empty() : Optional.of(membership);
                }
                case "delete" -> { assertSame(membership, a[0]); yield null; }
                case "flush" -> { if (deleteFails) throw new IllegalStateException("DB failure"); yield null; }
                case "save" -> {
                    if (notificationFails) throw new IllegalStateException("DB failure");
                    notification = (Notification) a[0]; yield notification;
                }
                default -> throw new AssertionError(m.getName());
            };
        }));
    }
}
