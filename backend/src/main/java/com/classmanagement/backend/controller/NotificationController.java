package com.classmanagement.backend.controller;

import com.classmanagement.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/request-rejected/{requestId}")
    public ResponseEntity<Void> createJoinClassRejectedNotification(
            @PathVariable Long requestId,
            Authentication authentication) {

        notificationService.createJoinClassRejectedNotification(
                requestId,
                authentication.getName());

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/request-approved/{requestId}")
    public ResponseEntity<Void> createJoinClassApprovedNotification(
            @PathVariable Long requestId,
            Authentication authentication) {

        notificationService.createJoinClassApprovedNotification(
                requestId,
                authentication.getName());

        return ResponseEntity.noContent().build();
    }

    
}