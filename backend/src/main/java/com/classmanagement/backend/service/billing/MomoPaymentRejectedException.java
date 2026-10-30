package com.classmanagement.backend.service.billing;

final class MomoPaymentRejectedException extends org.springframework.web.server.ResponseStatusException {
    MomoPaymentRejectedException(String message) {
        super(org.springframework.http.HttpStatus.BAD_GATEWAY, message);
    }
}