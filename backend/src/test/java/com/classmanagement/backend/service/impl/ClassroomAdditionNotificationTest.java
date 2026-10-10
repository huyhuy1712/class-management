package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.classroom.AddStudentToClassroomRequest;
import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.exception.ConflictException;
import com.classmanagement.backend.repository.*;
import com.classmanagement.backend.repository.classroom.*;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Proxy;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class ClassroomAdditionNotificationTest {
    private boolean existing;
    private boolean notificationFails;
    private final User student = User.builder().id(21L).role(UserRole.STUDENT).status(UserStatus.ACTIVE).build();
    private final List<String> writes = new ArrayList<>();
    private Notification notification;

    @Test void successfulAdditionCreatesOneUnreadNotificationWithExactMessage() {
        add();
        assertEquals(List.of("membership", "notification"), writes);
        assertSame(student, notification.getUser());
        assertEquals(NotificationType.CLASS_ADDED, notification.getType());
        assertEquals("Bạn đã được giáo viên thêm vào lớp Anh 12A5", notification.getMessage());
        assertEquals("CLASS", notification.getReferenceType());
        assertEquals(3L, notification.getReferenceId());
        assertFalse(notification.isRead());
    }
    @Test void existingStudentDoesNotReceiveNotification() {
        existing = true;
        assertThrows(ConflictException.class, this::add);
        assertTrue(writes.isEmpty());
    }
    @Test void wrongRoleDoesNotWrite() {
        student.setRole(UserRole.TEACHER);
        assertThrows(IllegalArgumentException.class, this::add);
        assertTrue(writes.isEmpty());
    }
    @Test void notificationFailurePropagatesForRollback() {
        notificationFails = true;
        assertThrows(IllegalStateException.class, this::add);
        assertEquals(List.of("membership", "notification"), writes);
    }
    private void add() {
        var request = new AddStudentToClassroomRequest();
        request.setStudentId(21L);
        new ClassroomServiceImpl(repo(ClassroomRepository.class), null, repo(UserRepository.class),
                repo(ClassStudentRepository.class), null, null, null, null, repo(NotificationRepository.class))
                .addStudent(3L, request);
    }
    private <T> T repo(Class<T> type) {
        return type.cast(Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, (p, m, a) -> {
            return switch (m.getName()) {
                case "findById" -> type == ClassroomRepository.class
                        ? Optional.of(Classroom.builder().id(3L).name("Anh 12A5").build()) : Optional.of(student);
                case "existsByClassroomIdAndStudentId" -> existing;
                case "save" -> {
                    if (type == NotificationRepository.class) {
                        writes.add("notification");
                        if (notificationFails) throw new IllegalStateException("DB failure");
                        notification = (Notification) a[0];
                    } else writes.add("membership");
                    yield a[0];
                }
                default -> throw new AssertionError(m.getName());
            };
        }));
    }
}
