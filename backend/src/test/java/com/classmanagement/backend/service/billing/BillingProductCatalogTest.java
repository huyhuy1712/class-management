package com.classmanagement.backend.service.billing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class BillingProductCatalogTest {
    private final BillingProductCatalog catalog = new BillingProductCatalog();

    @Test
    void pointBundlesMatchDisplayedPricesAndBalances() {
        assertPointBundle("points-20", 20, 100_000);
        assertPointBundle("points-30", 30, 150_000);
        assertPointBundle("points-50", 50, 250_000);
        assertPointBundle("points-70", 70, 350_000);
        assertPointBundle("points-100", 100, 500_000);
        assertPointBundle("points-250", 250, 1_250_000);
        assertPointBundle("points-500", 500, 2_500_000);
        assertPointBundle("points-600", 600, 3_000_000);
        assertPointBundle("points-800", 800, 4_000_000);
        assertPointBundle("points-1000", 1_000, 5_000_000);
    }

    private void assertPointBundle(String code, int points, long amountVnd) {
        var product = catalog.require(code);
        assertEquals(points, product.pointsGranted());
        assertEquals(amountVnd, product.amountVnd());
        assertEquals(points * 5_000L, product.amountVnd());
    }

    @Test
    void directVipProductsUseServerOwnedPricesAndPointConversion() {
        var personal = catalog.require("vip-personal-1m");
        assertEquals(100_000, personal.amountVnd());
        assertEquals(20, personal.pointsRequired());
        assertEquals(BillingProductCatalog.VipTier.PERSONAL, personal.vipTier());

        var devices = catalog.require("vip-10-devices-12m");
        assertEquals(2_500_000, devices.amountVnd());
        assertEquals(500, devices.pointsRequired());
        assertEquals(12, devices.durationMonths());
        assertEquals(10, devices.deviceLimit());
    }

    @Test
    void everyVipPriceConvertsAtFiveThousandVndPerPoint() {
        assertPointConversion("vip-personal-1m", 100_000, 20);
        assertPointConversion("vip-personal-3m", 250_000, 50);
        assertPointConversion("vip-personal-12m", 500_000, 100);
        assertPointConversion("vip-5-devices-1m", 200_000, 40);
        assertPointConversion("vip-5-devices-3m", 400_000, 80);
        assertPointConversion("vip-5-devices-12m", 1_000_000, 200);
        assertPointConversion("vip-10-devices-1m", 350_000, 70);
        assertPointConversion("vip-10-devices-3m", 600_000, 120);
        assertPointConversion("vip-10-devices-12m", 2_500_000, 500);
    }

    private void assertPointConversion(String code, long amountVnd, int expectedPoints) {
        var product = catalog.require(code);
        assertEquals(amountVnd, product.amountVnd());
        assertEquals(product.amountVnd() / 5_000, product.pointsRequired());
        assertEquals(expectedPoints, product.pointsRequired());
    }

    @Test
    void unknownProductCannotBePriced() {
        assertThrows(IllegalArgumentException.class, () -> catalog.require("client-defined-price"));
    }
}