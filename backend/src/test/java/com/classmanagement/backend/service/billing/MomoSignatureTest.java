package com.classmanagement.backend.service.billing;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import com.classmanagement.backend.dto.billing.MomoIpnRequest;
import com.fasterxml.jackson.databind.ObjectMapper;

class MomoSignatureTest {
    @Test
    void matchesTheStandardHmacSha256TestVector() {
        assertEquals("f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8",
                MomoSignature.sign("key", "The quick brown fox jumps over the lazy dog"));
    }

    @Test
    void verifiesOnlyTheSignatureForTheExactPayload() {
        String signature = MomoSignature.sign("secret", "orderId=123&amount=49000");

        assertTrue(MomoSignature.matches("secret", "orderId=123&amount=49000", signature));
        assertFalse(MomoSignature.matches("wrong", "orderId=123&amount=49000", signature));
        assertFalse(MomoSignature.matches("secret", "orderId=123&amount=49001", signature));
        assertFalse(MomoSignature.matches("secret", "orderId=123&amount=49000", ""));
    }

        @Test
        void verifiesTheMoMoIpnCanonicalPayloadAndMerchant() {
        var client = new MomoPaymentClient(new ObjectMapper(), true, "https://momo.test/create",
            "partner", "access", "secret", "https://backend.test/api/billing/momo/ipn",
            "https://frontend.test");
        var unsigned = new MomoIpnRequest("partner", "order-1", "request-1", 49_000L,
            "payment", "momo_wallet", "transaction-1", "success", 0,
            "Successful.", "qr", "1700000000000", "", null);
        String signature = MomoSignature.sign("secret", MomoPaymentClient.ipnRawData(unsigned, "access"));
        var signed = new MomoIpnRequest(unsigned.partnerCode(), unsigned.orderId(), unsigned.requestId(),
            unsigned.amount(), unsigned.orderInfo(), unsigned.orderType(), unsigned.transId(),
            unsigned.resultType(), unsigned.resultCode(), unsigned.message(), unsigned.payType(),
            unsigned.responseTime(), unsigned.extraData(), signature);

        assertTrue(client.isValidIpn(signed));
        var wrongMerchant = new MomoIpnRequest("other", signed.orderId(), signed.requestId(), signed.amount(),
            signed.orderInfo(), signed.orderType(), signed.transId(), signed.resultType(),
            signed.resultCode(), signed.message(), signed.payType(), signed.responseTime(),
            signed.extraData(), signed.signature());
        assertFalse(client.isValidIpn(wrongMerchant));
        }
}