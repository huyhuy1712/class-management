package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.repository.NotificationRepository;
import com.classmanagement.backend.repository.request.*;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Proxy;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class RequestRejectionTest {
    private final Request request = Request.builder().id(12L).type(RequestType.JOIN_CLASS)
            .status(RequestStatus.PENDING)
            .sender(User.builder().id(21L).role(UserRole.STUDENT).build())
            .receiver(User.builder().username("teacher").role(UserRole.TEACHER).build()).build();
    private final List<String> calls = new ArrayList<>();
    private boolean missing;
    private boolean notificationFails;
    private Notification notification;
    private ClassroomStatus classroomStatus = ClassroomStatus.ACTIVE;
    private boolean membershipFails;
    private boolean detailDeleted;
    private boolean detailFlushed;

    @Test void createsNotificationThenDeletesAndFlushesWithoutRejectedUpdate() {
        service().rejectJoinClassRequest(12L, "teacher");
        assertEquals(List.of("findByIdForUpdate", "findByRequest_Id", "save", "deleteDetail", "flushDetail", "delete", "flush"), calls);
        assertEquals(RequestStatus.PENDING, request.getStatus());
        assertEquals(NotificationType.REQUEST_REJECTED, notification.getType());
        assertSame(request.getSender(), notification.getUser());
        assertEquals("CLASS", notification.getReferenceType());
        assertEquals(3L, notification.getReferenceId());
        assertTrue(notification.getMessage().contains("English"));
    }
    @Test void wrongTeacherCannotWrite() {
        assertThrows(IllegalStateException.class, () -> service().rejectJoinClassRequest(12L, "other"));
        assertEquals(List.of("findByIdForUpdate"), calls);
    }
    @Test void handledRequestCannotWrite() {
        request.setStatus(RequestStatus.APPROVED);
        assertThrows(IllegalArgumentException.class, () -> service().rejectJoinClassRequest(12L, "teacher"));
        assertEquals(List.of("findByIdForUpdate"), calls);
    }
    @Test void missingRequestCannotCreateAnotherNotification() {
        missing = true;
        assertThrows(IllegalArgumentException.class, () -> service().rejectJoinClassRequest(12L, "teacher"));
        assertEquals(List.of("findByIdForUpdate"), calls);
    }
    @Test void otherRequestTypeCannotBeDeleted() {
        request.setType(RequestType.ABSENCE);
        assertThrows(IllegalArgumentException.class, () -> service().rejectJoinClassRequest(12L, "teacher"));
        assertEquals(List.of("findByIdForUpdate"), calls);
    }
    @Test void notificationFailureStopsDeletion() {
        notificationFails = true;
        assertThrows(IllegalStateException.class, () -> service().rejectJoinClassRequest(12L, "teacher"));
        assertFalse(calls.contains("delete"));
    }
    @Test void approvalUsesTheSameLock() {
        service().approveJoinClassRequest(12L, "teacher");
        assertEquals(List.of("findByIdForUpdate", "findByRequest_Id", "insertMembershipIfAbsent", "save", "deleteDetail", "flushDetail", "delete", "flush"), calls);
        assertEquals(RequestStatus.PENDING, request.getStatus());
        assertEquals(NotificationType.REQUEST_APPROVED, notification.getType());
        assertFalse(notification.isRead());
        assertEquals("CLASS", notification.getReferenceType());
        assertEquals(3L, notification.getReferenceId());
    }
    @Test void approvalRejectsArchivedClassBeforeWrites() {
        classroomStatus = ClassroomStatus.ARCHIVED;
        assertThrows(IllegalArgumentException.class, () -> service().approveJoinClassRequest(12L, "teacher"));
        assertEquals(List.of("findByIdForUpdate", "findByRequest_Id"), calls);
    }
    @Test void approvalRejectsWrongOwnerBeforeWrites() {
        assertThrows(IllegalStateException.class, () -> service().approveJoinClassRequest(12L, "other"));
        assertEquals(List.of("findByIdForUpdate"), calls);
    }
    @Test void membershipFailureStopsNotificationAndDeletion() {
        membershipFails = true;
        assertThrows(IllegalStateException.class, () -> service().approveJoinClassRequest(12L, "teacher"));
        assertFalse(calls.contains("save"));
        assertFalse(calls.contains("delete"));
    }
    @Test void approvalNotificationFailureStopsDeletion() {
        notificationFails = true;
        assertThrows(IllegalStateException.class, () -> service().approveJoinClassRequest(12L, "teacher"));
        assertFalse(calls.contains("delete"));
    }
    private RequestServiceImpl service() {
        return new RequestServiceImpl(repo(ClassJoinRequestDetailRepository.class), null,
                repo(RequestRepository.class), repo(ClassStudentRepository.class), null, null, repo(NotificationRepository.class));
    }
    private <T> T repo(Class<T> type) {
        return type.cast(Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, (p, m, a) -> {
            calls.add(type == ClassJoinRequestDetailRepository.class && m.getName().equals("delete") ? "deleteDetail"
                    : type == ClassJoinRequestDetailRepository.class && m.getName().equals("flush") ? "flushDetail" : m.getName());
            return switch (m.getName()) {
                case "findByIdForUpdate" -> missing ? Optional.empty() : Optional.of(request);
                case "findByRequest_Id" -> Optional.of(ClassJoinRequestDetail.builder().request(request)
                        .classroom(Classroom.builder().id(3L).name("English").status(classroomStatus).build()).build());
                case "insertMembershipIfAbsent" -> {
                    assertArrayEquals(new Object[]{3L, 21L}, a);
                    if (membershipFails) throw new IllegalStateException("DB failure");
                    yield 0; // An existing membership must still allow approval to finish.
                }
                case "save" -> {
                    if (type == NotificationRepository.class) {
                        if (notificationFails) throw new IllegalStateException("DB failure");
                        notification = (Notification) a[0];
                    }
                    yield a[0];
                }
                case "delete" -> {
                    if (type == ClassJoinRequestDetailRepository.class) {
                        assertSame(request, ((ClassJoinRequestDetail) a[0]).getRequest());
                        detailDeleted = true;
                    } else {
                        assertTrue(detailFlushed, "Detail must be removed and flushed before deleting Request");
                        assertSame(request, a[0]);
                    }
                    yield null;
                }
                case "flush" -> {
                    if (type == ClassJoinRequestDetailRepository.class) {
                        assertTrue(detailDeleted);
                        detailFlushed = true;
                    } else assertTrue(detailFlushed);
                    yield null;
                }
                default -> throw new AssertionError(m.getName());
            };
        }));
    }
}
