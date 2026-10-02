package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.request.JoinClassRequestResponse;
import com.classmanagement.backend.service.RequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class RequestController {

    private final RequestService requestService;

    @GetMapping("/join-class/received")
    public ResponseEntity<List<JoinClassRequestResponse>> getPendingJoinClassRequests(
            Authentication authentication) {
        return ResponseEntity.ok(
                requestService.getPendingJoinClassRequests(
                        authentication.getName()));
    }

    @PatchMapping("/{requestId}/reject")
    public ResponseEntity<Void> rejectJoinClassRequest(
            @PathVariable Long requestId,
            Authentication authentication) {

        requestService.rejectJoinClassRequest(
                requestId,
                authentication.getName());

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{requestId}/approve")
    public ResponseEntity<Void> approveJoinClassRequest(
            @PathVariable Long requestId,
            Authentication authentication) {
        requestService.approveJoinClassRequest(
                requestId,
                authentication.getName());

        return ResponseEntity.noContent().build();
    }

    
}