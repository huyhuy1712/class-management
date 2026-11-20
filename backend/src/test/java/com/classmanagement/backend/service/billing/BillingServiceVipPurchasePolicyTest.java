package com.classmanagement.backend.service.billing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.classmanagement.backend.entity.billing.TeacherVipSubscription;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class BillingServiceVipPurchasePolicyTest {
    private final BillingProductCatalog catalog = new BillingProductCatalog();

    @Test
    void allowsRenewingCurrentTier() {
        assertDoesNotThrow(() -> BillingService.validateVipPurchase(
                List.of(subscription(5)), catalog.require("vip-5-devices-3m")));
    }

    @Test
    void allowsUpgradingToHigherTier() {
        assertDoesNotThrow(() -> BillingService.validateVipPurchase(
                List.of(subscription(5)), catalog.require("vip-10-devices-1m")));
    }

    @Test
    void rejectsBuyingLowerTierWhileHigherTierIsActive() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> BillingService.validateVipPurchase(
                        List.of(subscription(10)), catalog.require("vip-5-devices-1m")));

        assertEquals(409, exception.getStatusCode().value());
    }

    @Test
    void allowsVipPurchaseWithoutAnActiveSubscription() {
        assertDoesNotThrow(() -> BillingService.validateVipPurchase(
                List.of(), catalog.require("vip-personal-1m")));
    }

    private TeacherVipSubscription subscription(int deviceLimit) {
        TeacherVipSubscription subscription = new TeacherVipSubscription();
        subscription.setDeviceLimit(deviceLimit);
        return subscription;
    }
}
