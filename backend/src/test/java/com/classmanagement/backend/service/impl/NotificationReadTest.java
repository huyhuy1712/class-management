package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.notification.NotificationResponse;
import com.classmanagement.backend.entity.enums.NotificationType;
import com.classmanagement.backend.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class NotificationReadTest {
    @Test void returnsEmptyListWithOneQuery() { verify(List.of()); }

    @Test void returnsReadAndUnreadNotificationsWithOneQuery() {
        verify(List.of(response(2L, false), response(1L, true)));
    }

    @Test void manyNotificationsStillUseOneQuery() {
        verify(java.util.stream.LongStream.rangeClosed(1, 100).mapToObj(id -> response(id, false)).toList());
    }

    private NotificationResponse response(long id, boolean read) {
        return new NotificationResponse(id, NotificationType.REQUEST_REJECTED, "Title", "Message",
                "CLASS", 3L, read, LocalDateTime.of(2026, 10, 10, 12, 0));
    }

    private void verify(List<NotificationResponse> expected) {
        int[] queries = {0};
        NotificationRepository repository = (NotificationRepository) Proxy.newProxyInstance(
                NotificationRepository.class.getClassLoader(), new Class<?>[]{NotificationRepository.class},
                (proxy, method, args) -> {
                    assertEquals("findResponsesByUsername", method.getName());
                    assertEquals("current-user", args[0]);
                    queries[0]++;
                    return expected;
                });
        var result = new NotificationServiceImpl(repository).getMyNotifications("current-user");
        assertSame(expected, result);
        assertEquals(1, queries[0]);
    }
}
