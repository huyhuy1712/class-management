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

    public record Mission(
            String code,
            String name,
            String description,
            int rewardPoints) {}

    private static final int VND_PER_POINT = 5_000;
    private static final List<Product> PRODUCT_LIST = List.of(
                    points("points-20", "20 Point", 100_000, 20),
                    points("points-30", "30 Point", 150_000, 30),
                    points("points-50", "50 Point", 250_000, 50),
                    points("points-70", "70 Point", 350_000, 70),
                    points("points-100", "100 Point", 500_000, 100),
                    points("points-250", "250 Point", 1_250_000, 250),
                    points("points-500", "500 Point", 2_500_000, 500),
                    points("points-600", "600 Point", 3_000_000, 600),
                    points("points-800", "800 Point", 4_000_000, 800),
                    points("points-1000", "1000 Point", 5_000_000, 1_000),
                    vip("vip-personal-1m", "VIP Cá nhân", VipTier.PERSONAL, 1, 100_000, 1),
                    vip("vip-personal-3m", "VIP Cá nhân", VipTier.PERSONAL, 1, 250_000, 3),
                    vip("vip-personal-12m", "VIP Cá nhân", VipTier.PERSONAL, 1, 500_000, 12),
                    vip("vip-5-devices-1m", "VIP 5 thiết bị", VipTier.FIVE_DEVICES, 5, 200_000, 1),
                    vip("vip-5-devices-3m", "VIP 5 thiết bị", VipTier.FIVE_DEVICES, 5, 400_000, 3),
                    vip("vip-5-devices-12m", "VIP 5 thiết bị", VipTier.FIVE_DEVICES, 5, 1_000_000, 12),
                    vip("vip-10-devices-1m", "VIP 10 thiết bị", VipTier.TEN_DEVICES, 10, 350_000, 1),
                    vip("vip-10-devices-3m", "VIP 10 thiết bị", VipTier.TEN_DEVICES, 10, 600_000, 3),
                    vip("vip-10-devices-12m", "VIP 10 thiết bị", VipTier.TEN_DEVICES, 10, 2_500_000, 12));
    private static final Map<String, Product> PRODUCTS = PRODUCT_LIST.stream()
            .collect(Collectors.toUnmodifiableMap(Product::code, Function.identity()));
    private static final List<Mission> MISSION_LIST = List.of(
            new Mission("first-class", "Tạo lớp đầu tiên", "Tạo lớp học đầu tiên của bạn", 5),
            new Mission("first-exam", "Tạo đề thi đầu tiên", "Lưu một đề thi hoàn chỉnh", 10),
            new Mission("first-published-exam", "Xuất bản đề thi đầu tiên", "Xuất bản đề thi để giao cho học sinh", 10),
            new Mission("ten-students", "Thêm 10 học sinh", "Thêm đủ 10 học sinh vào các lớp của bạn", 5));

    public List<Product> products() {
        return PRODUCT_LIST;
    }

    public Product require(String code) {
        Product product = PRODUCTS.get(code);
        if (product == null) throw new IllegalArgumentException("Gói thanh toán không hợp lệ");
        return product;
    }

    public List<Mission> missions() {
        return MISSION_LIST;
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