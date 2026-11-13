package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.billing.BillingOrderResponse;
import com.classmanagement.backend.dto.billing.BillingOverviewResponse;
import com.classmanagement.backend.dto.billing.BillingMissionResponse;
import com.classmanagement.backend.dto.billing.CreateBillingOrderRequest;
import com.classmanagement.backend.dto.billing.MomoIpnRequest;
import com.classmanagement.backend.dto.billing.MomoIpnResponse;
import com.classmanagement.backend.dto.billing.RedeemVipRequest;
import com.classmanagement.backend.service.billing.BillingService;
import jakarta.validation.Valid;
import java.util.UUID;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {
    private final BillingService billingService;

    @GetMapping("/me")
    public BillingOverviewResponse overview(Authentication authentication) {
        return billingService.overview(authentication.getName());
    }

    @GetMapping("/missions")
    public List<BillingMissionResponse> missions(Authentication authentication) {
        return billingService.missions(authentication.getName());
    }

    @PostMapping("/missions/{missionCode}/claim")
    public BillingMissionResponse claimMission(
            Authentication authentication, @PathVariable String missionCode) {
        return billingService.claimMission(authentication.getName(), missionCode);
    }

    @PostMapping("/orders")
    public ResponseEntity<BillingOrderResponse> createOrder(
            Authentication authentication,
            @Valid @RequestBody CreateBillingOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(billingService.createOrder(authentication.getName(), request));
    }

    @GetMapping("/orders/{orderId}")
    public BillingOrderResponse orderStatus(
            Authentication authentication, @PathVariable UUID orderId) {
        return billingService.orderStatus(authentication.getName(), orderId);
    }

    @GetMapping("/invoices")
    public List<com.classmanagement.backend.dto.billing.BillingInvoiceResponse> invoices(
            Authentication authentication) {
        return billingService.invoices(authentication.getName());
    }

    @GetMapping("/invoices/{invoiceId}")
    public com.classmanagement.backend.dto.billing.BillingInvoiceResponse invoice(
            Authentication authentication, @PathVariable UUID invoiceId) {
        return billingService.invoice(authentication.getName(), invoiceId);
    }

    @PostMapping("/vip/redeem")
    public BillingOverviewResponse redeemVip(
            Authentication authentication, @Valid @RequestBody RedeemVipRequest request) {
        return billingService.redeemVip(authentication.getName(), request);
    }

    @PostMapping("/momo/ipn")
    public ResponseEntity<MomoIpnResponse> momoIpn(@RequestBody MomoIpnRequest request) {
        boolean accepted = billingService.acceptIpn(request);
        return ResponseEntity.status(accepted ? HttpStatus.OK : HttpStatus.BAD_REQUEST)
                .body(accepted ? MomoIpnResponse.success() : MomoIpnResponse.rejected());
    }
}