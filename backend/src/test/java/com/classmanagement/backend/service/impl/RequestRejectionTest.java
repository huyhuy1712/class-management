package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.repository.NotificationRepository;
import com.classmanagement.backend.repository.request.*;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Proxy;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class RequestRejectionTest {
    private final Request request = Request.builder().id(12L).type(RequestType.JOIN_CLASS)
            .status(RequestStatus.PENDING)
            .sender(User.builder().id(21L).build())
            .receiver(User.builder().username("teacher").role(UserRole.TEACHER).build()).build();
    private final List<String> calls = new ArrayList<>();
    private boolean missing;
    private boolean notificationFails;
    private Notification notification;

    @Test void createsNotificationThenDeletesAndFlushesWithoutRejectedUpdate() {
        service().rejectJoinClassRequest(12L, "teacher");
        assertEquals(List.of("findByIdForUpdate", "findByRequest_Id", "save", "delete", "flush"), calls);
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
        assertEquals(List.of("findByIdForUpdate", "findByRequest_Id", "save"), calls);
        assertEquals(RequestStatus.APPROVED, request.getStatus());
    }
    private RequestServiceImpl service() {
        return new RequestServiceImpl(repo(ClassJoinRequestDetailRepository.class), null,
                repo(RequestRepository.class), null, null, null, repo(NotificationRepository.class));
    }
    private <T> T repo(Class<T> type) {
        return type.cast(Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, (p, m, a) -> {
            calls.add(m.getName());
            return switch (m.getName()) {
                case "findByIdForUpdate" -> missing ? Optional.empty() : Optional.of(request);
                case "findByRequest_Id" -> Optional.of(ClassJoinRequestDetail.builder().request(request)
                        .classroom(Classroom.builder().id(3L).name("English").build()).build());
                case "save" -> {
                    if (type == NotificationRepository.class) {
                        if (notificationFails) throw new IllegalStateException("DB failure");
                        notification = (Notification) a[0];
                    }
                    yield a[0];
                }
                case "delete" -> { assertSame(request, a[0]); yield null; }
                case "flush" -> null;
                default -> throw new AssertionError(m.getName());
            };
        }));
    }
}
