package com.classmanagement.backend.service;

public interface NotificationService {

    void createJoinClassRejectedNotification(
            Long requestId,
            String username);

    void createJoinClassApprovedNotification(
            Long requestId,
            String username);
            
}