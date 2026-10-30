package com.classmanagement.backend.dto.billing;

public record MomoIpnResponse(int resultCode, String message) {
    public static MomoIpnResponse success() {
        return new MomoIpnResponse(0, "Success");
    }

    public static MomoIpnResponse rejected() {
        return new MomoIpnResponse(1, "Invalid payment notification");
    }
}