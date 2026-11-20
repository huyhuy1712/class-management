package com.classmanagement.backend.service.billing;

import com.classmanagement.backend.entity.billing.BillingOrder;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class VnpayPaymentClient {
    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter VNPAY_DATE = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final boolean enabled;
    private final String endpoint;
    private final String tmnCode;
    private final String hashSecret;
    private final String ipnUrl;
    private final String frontendUrl;

    public VnpayPaymentClient(
            @Value("${app.payment.vnpay.enabled:false}") boolean enabled,
            @Value("${app.payment.vnpay.endpoint:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}") String endpoint,
            @Value("${app.payment.vnpay.tmn-code:}") String tmnCode,
            @Value("${app.payment.vnpay.hash-secret:}") String hashSecret,
            @Value("${app.payment.vnpay.ipn-url:}") String ipnUrl,
            @Value("${app.frontend.url:http://localhost:5173}") String frontendUrl) {
        this.enabled = enabled;
        this.endpoint = endpoint;
        this.tmnCode = tmnCode;
        this.hashSecret = hashSecret;
        this.ipnUrl = ipnUrl;
        this.frontendUrl = frontendUrl;
    }

    public String createPayUrl(BillingOrder order, String clientIp) {
        requireConfigured();
        if (clientIp == null || clientIp.isBlank()) {
            throw new IllegalArgumentException("Không xác định được địa chỉ IP của người thanh toán");
        }

        String txnRef = compactOrderId(order.getId());
        Map<String, String> parameters = new TreeMap<>();
        parameters.put("vnp_Version", "2.1.0");
        parameters.put("vnp_Command", "pay");
        parameters.put("vnp_TmnCode", tmnCode);
        parameters.put("vnp_Amount", Long.toString(Math.multiplyExact(order.getAmountVnd(), 100)));
        parameters.put("vnp_CurrCode", "VND");
        parameters.put("vnp_TxnRef", txnRef);
        parameters.put("vnp_OrderInfo", "Thanh toan don hang " + txnRef);
        parameters.put("vnp_OrderType", "other");
        parameters.put("vnp_Locale", "vn");
        parameters.put("vnp_ReturnUrl", frontendUrl.replaceAll("/$", "")
                + "/teacher/billing?orderId=" + order.getId());
        parameters.put("vnp_IpAddr", clientIp);
        parameters.put("vnp_CreateDate", formatDate(OffsetDateTime.now()));
        parameters.put("vnp_ExpireDate", formatDate(order.getExpiresAt()));

        StringBuilder url = new StringBuilder(endpoint).append('?')
                .append(VnpaySignature.canonicalQuery(parameters))
                .append("&vnp_SecureHash=")
                .append(VnpaySignature.sign(hashSecret, parameters));
        return url.toString();
    }

    public boolean isValidIpn(Map<String, String> parameters) {
        if (!isAvailable() || parameters == null
                || !tmnCode.equals(parameters.get("vnp_TmnCode"))) {
            return false;
        }
        return VnpaySignature.matches(hashSecret, parameters, parameters.get("vnp_SecureHash"));
    }

    public boolean isAvailable() {
        return enabled && !endpoint.isBlank() && !tmnCode.isBlank()
                && !hashSecret.isBlank() && !ipnUrl.isBlank();
    }

    public void requireAvailable() {
        requireConfigured();
    }

    static UUID orderIdFromTxnRef(String txnRef) {
        if (txnRef == null || !txnRef.matches("[0-9a-fA-F]{32}")) {
            throw new IllegalArgumentException("Invalid VNPay transaction reference");
        }
        String uuid = txnRef.substring(0, 8) + "-" + txnRef.substring(8, 12) + "-"
                + txnRef.substring(12, 16) + "-" + txnRef.substring(16, 20) + "-"
                + txnRef.substring(20);
        return UUID.fromString(uuid);
    }

    private static String compactOrderId(UUID orderId) {
        return orderId.toString().replace("-", "");
    }

    private static String formatDate(OffsetDateTime dateTime) {
        return dateTime.atZoneSameInstant(VIETNAM_ZONE).format(VNPAY_DATE);
    }

    private void requireConfigured() {
        if (!isAvailable()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE, "Thanh toán VNPay chưa được cấu hình đầy đủ");
        }
    }
}
