package com.classmanagement.backend.service.billing;

import java.net.URLEncoder;
import java.security.GeneralSecurityException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;
import java.util.TreeMap;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

final class VnpaySignature {
    private VnpaySignature() {}

    static String sign(String secretKey, Map<String, String> parameters) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] digest = mac.doFinal(canonicalQuery(parameters).getBytes(StandardCharsets.UTF_8));
            return toHex(digest);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Không thể ký dữ liệu thanh toán VNPay", exception);
        }
    }

    static boolean matches(String secretKey, Map<String, String> parameters, String signature) {
        if (signature == null || signature.isBlank()) return false;
        byte[] expected = sign(secretKey, parameters).getBytes(StandardCharsets.US_ASCII);
        byte[] received = signature.toLowerCase(java.util.Locale.ROOT)
                .getBytes(StandardCharsets.US_ASCII);
        return MessageDigest.isEqual(expected, received);
    }

    static String canonicalQuery(Map<String, String> parameters) {
        Map<String, String> sorted = new TreeMap<>();
        parameters.forEach((key, value) -> {
            if (key != null && key.startsWith("vnp_")
                    && !"vnp_SecureHash".equals(key)
                    && !"vnp_SecureHashType".equals(key)
                    && value != null && !value.isEmpty()) {
                sorted.put(key, value);
            }
        });
        return sorted.entrySet().stream()
                .map(entry -> encode(entry.getKey()) + "=" + encode(entry.getValue()))
                .collect(java.util.stream.Collectors.joining("&"));
    }

    static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private static String toHex(byte[] bytes) {
        StringBuilder result = new StringBuilder(bytes.length * 2);
        for (byte value : bytes) {
            result.append(Character.forDigit((value >> 4) & 0xF, 16));
            result.append(Character.forDigit(value & 0xF, 16));
        }
        return result.toString();
    }
}
