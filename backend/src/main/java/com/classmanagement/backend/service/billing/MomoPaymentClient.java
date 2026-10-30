package com.classmanagement.backend.service.billing;

import com.classmanagement.backend.dto.billing.MomoIpnRequest;
import com.classmanagement.backend.entity.billing.BillingOrder;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class MomoPaymentClient {
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final ObjectMapper json;
    private final boolean enabled;
    private final String endpoint;
    private final String partnerCode;
    private final String accessKey;
    private final String secretKey;
    private final String ipnUrl;
    private final String frontendUrl;

    public MomoPaymentClient(
            ObjectMapper json,
            @Value("${app.payment.momo.enabled:false}") boolean enabled,
            @Value("${app.payment.momo.endpoint:https://test-payment.momo.vn/v2/gateway/api/create}") String endpoint,
            @Value("${app.payment.momo.partner-code:}") String partnerCode,
            @Value("${app.payment.momo.access-key:}") String accessKey,
            @Value("${app.payment.momo.secret-key:}") String secretKey,
            @Value("${app.payment.momo.ipn-url:}") String ipnUrl,
            @Value("${app.frontend.url:http://localhost:5173}") String frontendUrl) {
        this.json = json;
        this.enabled = enabled;
        this.endpoint = endpoint;
        this.partnerCode = partnerCode;
        this.accessKey = accessKey;
        this.secretKey = secretKey;
        this.ipnUrl = ipnUrl;
        this.frontendUrl = frontendUrl;
    }

    public String createPayUrl(BillingOrder order) {
        requireConfigured();
        String orderId = order.getId().toString();
        String requestId = order.getRequestId().toString();
        String amount = Long.toString(order.getAmountVnd());
        String extraData = "";
        String orderInfo = "Thanh toan " + order.getProductCode();
        String redirectUrl = frontendUrl.replaceAll("/$", "") + "/teacher/billing?orderId=" + orderId;
        String rawData = "accessKey=" + accessKey
                + "&amount=" + amount
                + "&extraData=" + extraData
                + "&ipnUrl=" + ipnUrl
                + "&orderId=" + orderId
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + partnerCode
                + "&redirectUrl=" + redirectUrl
                + "&requestId=" + requestId
                + "&requestType=captureWallet";

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("partnerCode", partnerCode);
        payload.put("requestId", requestId);
        payload.put("orderId", orderId);
        payload.put("amount", order.getAmountVnd());
        payload.put("orderInfo", orderInfo);
        payload.put("redirectUrl", redirectUrl);
        payload.put("ipnUrl", ipnUrl);
        payload.put("requestType", "captureWallet");
        payload.put("extraData", extraData);
        payload.put("lang", "vi");
        payload.put("autoCapture", true);
        payload.put("signature", MomoSignature.sign(secretKey, rawData));

        try {
            String body = json.writeValueAsString(payload);
            HttpRequest request = HttpRequest.newBuilder(URI.create(endpoint))
                    .timeout(Duration.ofSeconds(20))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> response = HTTP.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("MoMo từ chối tạo yêu cầu thanh toán");
            }
            JsonNode result = json.readTree(response.body());
            if (result.path("resultCode").asInt(-1) != 0) {
                throw new MomoPaymentRejectedException("MoMo từ chối yêu cầu thanh toán");
            }
            if (!result.path("payUrl").isTextual()
                    || result.path("payUrl").asText().isBlank()) {
                throw new IllegalStateException("Không thể tạo liên kết thanh toán MoMo");
            }
            return result.path("payUrl").asText();
        } catch (IOException exception) {
            throw new IllegalStateException("Không thể giao tiếp với MoMo", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Yêu cầu thanh toán MoMo bị gián đoạn", exception);
        }
    }

    public boolean isValidIpn(MomoIpnRequest ipn) {
        if (!enabled || partnerCode.isBlank() || accessKey.isBlank() || secretKey.isBlank()
            || ipn == null || ipn.amount() == null || ipn.resultCode() == null
                || !partnerCode.equals(ipn.partnerCode())) return false;
        String rawData = ipnRawData(ipn, accessKey);
        return MomoSignature.matches(secretKey, rawData, ipn.signature());
    }

    public boolean isAvailable() {
        return enabled && !partnerCode.isBlank() && !accessKey.isBlank()
                && !secretKey.isBlank() && !ipnUrl.isBlank();
    }

    public void requireAvailable() {
        requireConfigured();
    }

    static String ipnRawData(MomoIpnRequest ipn, String accessKey) {
        return "accessKey=" + accessKey
                + "&amount=" + ipn.amount()
                + "&extraData=" + value(ipn.extraData())
                + "&message=" + value(ipn.message())
                + "&orderId=" + value(ipn.orderId())
                + "&orderInfo=" + value(ipn.orderInfo())
                + "&orderType=" + value(ipn.orderType())
                + "&partnerCode=" + value(ipn.partnerCode())
                + "&payType=" + value(ipn.payType())
                + "&requestId=" + value(ipn.requestId())
                + "&responseTime=" + value(ipn.responseTime())
                + "&resultCode=" + ipn.resultCode()
                + "&transId=" + value(ipn.transId());
    }

    private void requireConfigured() {
        if (!enabled || partnerCode.isBlank() || accessKey.isBlank() || secretKey.isBlank() || ipnUrl.isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                    "Thanh toán MoMo chưa được cấu hình đầy đủ");
        }
    }

    private static String value(String value) {
        return value == null ? "" : value;
    }
}