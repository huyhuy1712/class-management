package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.repository.NotificationRepository;
import com.classmanagement.backend.service.NotificationService;
import com.classmanagement.backend.dto.notification.NotificationResponse;
import java.util.List;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(String username) {
        return notificationRepository.findResponsesByUsername(username);
    }

    @Override
    @Transactional
    public void deleteMyNotification(Long notificationId, String username) {
        validateNotificationId(notificationId);
        requireOwnedNotification(notificationRepository.deleteOwnedNotification(notificationId, username));
    }

    @Override
    @Transactional
    public void updateMyNotificationReadStatus(Long notificationId, String username, boolean read) {
        validateNotificationId(notificationId);
        requireOwnedNotification(notificationRepository.updateOwnedReadStatus(notificationId, username, read));
    }

    private void validateNotificationId(Long notificationId) {
        if (notificationId == null || notificationId <= 0) {
            throw new IllegalArgumentException("notificationId phải lớn hơn 0");
        }
    }

    private void requireOwnedNotification(int affectedRows) {
        if (affectedRows == 0) {
            throw new ResourceNotFoundException("Không tìm thấy thông báo của bạn");
        }
    }
}
