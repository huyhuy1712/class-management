package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.notification.NotificationResponse;
import java.util.List;

public interface NotificationService {
    List<NotificationResponse> getMyNotifications(String username);
    void deleteMyNotification(Long notificationId, String username);
    void updateMyNotificationReadStatus(Long notificationId, String username, boolean read);


            
}
