package com.classmanagement.backend.service.billing;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class BillingProductCatalog {
    public enum Type {
        POINTS,
        VIP
    }

    public enum VipTier {
        PERSONAL,
        FIVE_DEVICES,
        TEN_DEVICES
    }

    public record Product(
            String code,
            String name,
            Type type,
            long amountVnd,
            int pointsGranted,
            int pointsRequired,
            VipTier vipTier,
            int deviceLimit,
            int durationMonths) {}

    private static final int VND_PER_POINT = 980;
    private static final List<Product> PRODUCT_LIST = List.of(
                    points("points-50", "50 Point", 49_000, 50),
                    points("points-500", "500 Point", 490_000, 500),
                    points("points-1000", "1000 Point", 980_000, 1_000),
                    vip("vip-personal-1m", "VIP Cá nhân", VipTier.PERSONAL, 1, 149_000, 1),
                    vip("vip-personal-3m", "VIP Cá nhân", VipTier.PERSONAL, 1, 399_000, 3),
                    vip("vip-personal-12m", "VIP Cá nhân", VipTier.PERSONAL, 1, 999_000, 12),
                    vip("vip-5-devices-1m", "VIP 5 thiết bị", VipTier.FIVE_DEVICES, 5, 299_000, 1),
                    vip("vip-5-devices-3m", "VIP 5 thiết bị", VipTier.FIVE_DEVICES, 5, 799_000, 3),
                    vip("vip-5-devices-12m", "VIP 5 thiết bị", VipTier.FIVE_DEVICES, 5, 1_999_000, 12),
                    vip("vip-10-devices-1m", "VIP 10 thiết bị", VipTier.TEN_DEVICES, 10, 549_000, 1),
                    vip("vip-10-devices-3m", "VIP 10 thiết bị", VipTier.TEN_DEVICES, 10, 1_499_000, 3),
                    vip("vip-10-devices-12m", "VIP 10 thiết bị", VipTier.TEN_DEVICES, 10, 3_999_000, 12));
    private static final Map<String, Product> PRODUCTS = PRODUCT_LIST.stream()
            .collect(Collectors.toUnmodifiableMap(Product::code, Function.identity()));

    public List<Product> products() {
        return PRODUCT_LIST;
    }

    public Product require(String code) {
        Product product = PRODUCTS.get(code);
        if (product == null) throw new IllegalArgumentException("Gói thanh toán không hợp lệ");
        return product;
    }

    private static Product points(String code, String name, long amountVnd, int points) {
        return new Product(code, name, Type.POINTS, amountVnd, points, 0, null, 0, 0);
    }

    private static Product vip(
            String code, String name, VipTier tier, int deviceLimit, long amountVnd, int months) {
        int points = (int) ((amountVnd + VND_PER_POINT - 1) / VND_PER_POINT);
        return new Product(code, name, Type.VIP, amountVnd, 0, points, tier, deviceLimit, months);
    }
}