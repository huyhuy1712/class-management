package com.classmanagement.backend.service.billing;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.classmanagement.backend.repository.billing.TeacherVipSubscriptionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class TeacherEntitlementServiceTest {
    private final TeacherVipSubscriptionRepository subscriptions = mock(TeacherVipSubscriptionRepository.class);
    private final TeacherEntitlementService entitlements = new TeacherEntitlementService(subscriptions);

    @Test
    void freeLimitsRejectOnlyOperationsThatExceedThePlan() {
        when(subscriptions.existsByTeacherIdAndExpiresAtAfter(org.mockito.ArgumentMatchers.eq(5L),
                org.mockito.ArgumentMatchers.any())).thenReturn(false);

        assertDoesNotThrow(() -> entitlements.requireClassCapacity(5L, 0));
        assertEquals(402, assertThrows(ResponseStatusException.class,
                () -> entitlements.requireClassCapacity(5L, 1)).getStatusCode().value());
        assertDoesNotThrow(() -> entitlements.requireExamCapacity(5L, 2));
        assertEquals(402, assertThrows(ResponseStatusException.class,
                () -> entitlements.requireExamCapacity(5L, 3)).getStatusCode().value());
        assertDoesNotThrow(() -> entitlements.requireAttemptLimit(5L, 2));
        assertThrows(ResponseStatusException.class, () -> entitlements.requireAttemptLimit(5L, 0));
    }

    @Test
    void activeVipRemovesCreationAndAttemptCaps() {
        when(subscriptions.existsByTeacherIdAndExpiresAtAfter(org.mockito.ArgumentMatchers.eq(8L),
                org.mockito.ArgumentMatchers.any())).thenReturn(true);

        assertDoesNotThrow(() -> entitlements.requireClassCapacity(8L, 100));
        assertDoesNotThrow(() -> entitlements.requireExamCapacity(8L, 100));
        assertDoesNotThrow(() -> entitlements.requireAttemptLimit(8L, 0));
        assertDoesNotThrow(() -> entitlements.requireVipFeature(8L, "import"));
    }
}