package com.classmanagement.backend.service.billing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.classmanagement.backend.entity.billing.BillingOrder;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

class VnpayPaymentClientTest {
    private static final String HASH_SECRET = "test-hash-secret";

    @Test
    void createsSignedPaymentUrlWithVnpayAmountEncodingAndOrderReference() {
        UUID orderId = UUID.fromString("123e4567-e89b-12d3-a456-426614174000");
        var client = client();
        String payUrl = client.createPayUrl(order(orderId), "127.0.0.1");

        Map<String, String> parameters = parseQuery(payUrl.substring(payUrl.indexOf('?') + 1));
        assertEquals("20000000", parameters.get("vnp_Amount"));
        assertEquals(orderId, VnpayPaymentClient.orderIdFromTxnRef(parameters.get("vnp_TxnRef")));
        assertEquals("TSTCODE1", parameters.get("vnp_TmnCode"));
        assertEquals("127.0.0.1", parameters.get("vnp_IpAddr"));
        assertTrue(VnpaySignature.matches(
                HASH_SECRET, parameters, parameters.get("vnp_SecureHash")));
        assertTrue(parameters.get("vnp_ReturnUrl").contains("orderId=" + orderId));
    }

    @Test
    void verifiesVnpayIpnSignatureAndMerchantCode() {
        var client = client();
        Map<String, String> unsigned = Map.of(
                "vnp_TmnCode", "TSTCODE1",
                "vnp_TxnRef", "123e4567e89b12d3a456426614174000",
                "vnp_Amount", "20000000",
                "vnp_ResponseCode", "00",
                "vnp_TransactionStatus", "00",
                "vnp_TransactionNo", "987654321");
        var signed = new java.util.HashMap<>(unsigned);
        signed.put("vnp_SecureHash", VnpaySignature.sign(HASH_SECRET, unsigned));

        assertTrue(client.isValidIpn(signed));

        signed.put("vnp_Amount", "20000001");
        assertFalse(client.isValidIpn(signed));
        signed.put("vnp_Amount", "20000000");
        signed.put("vnp_TmnCode", "OTHER001");
        signed.put("vnp_SecureHash", VnpaySignature.sign(HASH_SECRET, signed));
        assertFalse(client.isValidIpn(signed));
    }

    private VnpayPaymentClient client() {
        return new VnpayPaymentClient(
                true,
                "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
                "TSTCODE1",
                HASH_SECRET,
                "https://backend.example/api/billing/vnpay/ipn",
                "https://frontend.example");
    }

    private BillingOrder order(UUID orderId) {
        BillingOrder order = new BillingOrder();
        order.setId(orderId);
        order.setAmountVnd(200_000);
        order.setExpiresAt(OffsetDateTime.parse("2026-11-13T21:00:00+07:00"));
        return order;
    }

    private Map<String, String> parseQuery(String query) {
        return Arrays.stream(query.split("&"))
                .map(part -> part.split("=", 2))
                .collect(Collectors.toMap(
                        pair -> URLDecoder.decode(pair[0], StandardCharsets.UTF_8),
                        pair -> URLDecoder.decode(pair[1], StandardCharsets.UTF_8)));
    }
}
