package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.notification.UpdateNotificationReadRequest;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.repository.NotificationRepository;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Proxy;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class NotificationMutationTest {
    private int affected = 1;
    private final List<String> calls = new ArrayList<>();
    private Object[] arguments;

    @Test void deletesWithOneOwnerScopedStatement() {
        service().deleteMyNotification(15L, "student");
        assertEquals(List.of("deleteOwnedNotification"), calls);
        assertArrayEquals(new Object[]{15L, "student"}, arguments);
    }
    @Test void updatesBothReadStatusesWithOneStatementEach() {
        var service = service();
        service.updateMyNotificationReadStatus(15L, "student", true);
        assertArrayEquals(new Object[]{15L, "student", true}, arguments);
        service.updateMyNotificationReadStatus(15L, "student", false);
        assertArrayEquals(new Object[]{15L, "student", false}, arguments);
        assertEquals(List.of("updateOwnedReadStatus", "updateOwnedReadStatus"), calls);
    }
    @Test void missingOrForeignNotificationCannotBeDeleted() {
        affected = 0;
        assertThrows(ResourceNotFoundException.class, () -> service().deleteMyNotification(15L, "other"));
        assertEquals(1, calls.size());
    }
    @Test void missingOrForeignNotificationCannotBeUpdated() {
        affected = 0;
        assertThrows(ResourceNotFoundException.class,
                () -> service().updateMyNotificationReadStatus(15L, "other", true));
        assertEquals(1, calls.size());
    }
    @Test void invalidIdsDoNotQueryDatabase() {
        var service = service();
        assertThrows(IllegalArgumentException.class, () -> service.deleteMyNotification(0L, "student"));
        assertThrows(IllegalArgumentException.class,
                () -> service.updateMyNotificationReadStatus(-1L, "student", false));
        assertThrows(IllegalArgumentException.class, () -> service.deleteMyNotification(null, "student"));
        assertTrue(calls.isEmpty());
    }
    @Test void readIsRequiredAndBothBooleanValuesAreValid() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            assertEquals(1, validator.validate(new UpdateNotificationReadRequest(null)).size());
            assertTrue(validator.validate(new UpdateNotificationReadRequest(true)).isEmpty());
            assertTrue(validator.validate(new UpdateNotificationReadRequest(false)).isEmpty());
        }
    }
    private NotificationServiceImpl service() {
        var repository = (NotificationRepository) Proxy.newProxyInstance(
                NotificationRepository.class.getClassLoader(), new Class<?>[]{NotificationRepository.class},
                (p, m, a) -> { calls.add(m.getName()); arguments = a; return affected; });
        return new NotificationServiceImpl(null, repository);
    }
}
