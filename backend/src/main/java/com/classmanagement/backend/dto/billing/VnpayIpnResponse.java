package com.classmanagement.backend.dto.billing;

import com.fasterxml.jackson.annotation.JsonProperty;

public record VnpayIpnResponse(
        @JsonProperty("RspCode") String rspCode,
        @JsonProperty("Message") String message) {
    public static VnpayIpnResponse success() {
        return new VnpayIpnResponse("00", "Confirm Success");
    }

    public static VnpayIpnResponse alreadyConfirmed() {
        return new VnpayIpnResponse("02", "Order already confirmed");
    }

    public static VnpayIpnResponse orderNotFound() {
        return new VnpayIpnResponse("01", "Order not found");
    }

    public static VnpayIpnResponse invalidAmount() {
        return new VnpayIpnResponse("04", "Invalid amount");
    }

    public static VnpayIpnResponse invalidSignature() {
        return new VnpayIpnResponse("97", "Invalid signature");
    }

    public static VnpayIpnResponse processingError() {
        return new VnpayIpnResponse("99", "Unknown error");
    }
}
