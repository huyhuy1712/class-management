package com.classmanagement.backend.controller;

import com.classmanagement.backend.service.NotificationService;
import com.classmanagement.backend.dto.notification.NotificationResponse;
import com.classmanagement.backend.dto.notification.UpdateNotificationReadRequest;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(Authentication authentication) {
        return ResponseEntity.ok(notificationService.getMyNotifications(authentication.getName()));
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteMyNotification(@PathVariable Long notificationId,
                                                    Authentication authentication) {
        notificationService.deleteMyNotification(notificationId, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<Void> updateMyNotificationReadStatus(@PathVariable Long notificationId,
            @Valid @RequestBody UpdateNotificationReadRequest request, Authentication authentication) {
        notificationService.updateMyNotificationReadStatus(notificationId, authentication.getName(), request.read());
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
