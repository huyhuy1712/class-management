package com.classmanagement.backend.service.billing;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

final class MomoSignature {
    private MomoSignature() {}

    static String sign(String secretKey, String rawData) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(rawData.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.GeneralSecurityException exception) {
            throw new IllegalStateException("Không thể ký dữ liệu thanh toán MoMo", exception);
        }
    }

    static boolean matches(String secretKey, String rawData, String signature) {
        if (signature == null || signature.isBlank()) return false;
        byte[] expected = sign(secretKey, rawData).toLowerCase().getBytes(StandardCharsets.US_ASCII);
        byte[] received = signature.toLowerCase().getBytes(StandardCharsets.US_ASCII);
        return MessageDigest.isEqual(expected, received);
    }
}