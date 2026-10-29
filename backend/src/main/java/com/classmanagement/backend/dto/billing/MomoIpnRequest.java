package com.classmanagement.backend.dto.billing;

public record MomoIpnRequest(
        String partnerCode,
        String orderId,
        String requestId,
        Long amount,
        String orderInfo,
        String orderType,
        String transId,
        String resultType,
        Integer resultCode,
        String message,
        String payType,
        String responseTime,
        String extraData,
        String signature) {}