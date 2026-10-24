package com.classmanagement.backend.service.billing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class BillingProductCatalogTest {
    private final BillingProductCatalog catalog = new BillingProductCatalog();

    @Test
    void pointBundlesMatchDisplayedPricesAndBalances() {
        assertEquals(49_000, catalog.require("points-50").amountVnd());
        assertEquals(50, catalog.require("points-50").pointsGranted());
        assertEquals(490_000, catalog.require("points-500").amountVnd());
        assertEquals(500, catalog.require("points-500").pointsGranted());
        assertEquals(980_000, catalog.require("points-1000").amountVnd());
        assertEquals(1_000, catalog.require("points-1000").pointsGranted());
    }

    @Test
    void directVipProductsUseServerOwnedPricesAndPointConversion() {
        var personal = catalog.require("vip-personal-1m");
        assertEquals(149_000, personal.amountVnd());
        assertEquals(153, personal.pointsRequired());
        assertEquals(BillingProductCatalog.VipTier.PERSONAL, personal.vipTier());

        var devices = catalog.require("vip-10-devices-12m");
        assertEquals(3_999_000, devices.amountVnd());
        assertEquals(12, devices.durationMonths());
        assertEquals(10, devices.deviceLimit());
    }

    @Test
    void unknownProductCannotBePriced() {
        assertThrows(IllegalArgumentException.class, () -> catalog.require("client-defined-price"));
    }
}