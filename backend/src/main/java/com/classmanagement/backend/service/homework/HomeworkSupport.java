package com.classmanagement.backend.service.homework;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.ZoneId;

public final class HomeworkSupport {
    private static final int MAX_SCORE = 1000;
    private HomeworkSupport() {}

    public static LocalDateTime parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDateTime.parse(value);
        } catch (RuntimeException error) {
            throw new IllegalArgumentException("Háº¡n ná»™p khĂ´ng há»£p lá»‡", error);
        }
    }

    public static BigDecimal parseScore(String value) {
        try {
            BigDecimal score = new BigDecimal(value);
            if (score.signum() < 0 || score.compareTo(BigDecimal.valueOf(MAX_SCORE)) > 0)
                throw new IllegalArgumentException("Äiá»ƒm tá»‘i Ä‘a pháº£i náº±m trong khoáº£ng 0 Ä‘áº¿n 1000");
            return score;
        } catch (NumberFormatException error) {
            throw new IllegalArgumentException("Äiá»ƒm tá»‘i Ä‘a khĂ´ng há»£p lá»‡", error);
        }
    }

    public static String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public static LocalDateTime now() {
        return LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
    }

    public static Long nullableLong(ResultSet rs, String column) throws SQLException {
        long value = rs.getLong(column);
        return rs.wasNull() ? null : value;
    }

    public static LocalDateTime localDate(ResultSet rs, String column) throws SQLException {
        java.sql.Timestamp value = rs.getTimestamp(column);
        return value == null ? null : value.toLocalDateTime();
    }
}
