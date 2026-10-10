package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.entity.ClassJoinRequestDetail;
import com.classmanagement.backend.entity.Notification;
import com.classmanagement.backend.entity.Request;
import com.classmanagement.backend.entity.enums.NotificationType;
import com.classmanagement.backend.entity.enums.RequestStatus;
import com.classmanagement.backend.entity.enums.RequestType;
import com.classmanagement.backend.repository.NotificationRepository;
import com.classmanagement.backend.repository.request.ClassJoinRequestDetailRepository;
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

    private final ClassJoinRequestDetailRepository classJoinRequestDetailRepository;
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

@Override
 @Transactional
public void createJoinClassApprovedNotification(
            Long requestId,
            String username) {

        ClassJoinRequestDetail detail = classJoinRequestDetailRepository
                .findByRequest_Id(requestId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy yêu cầu tham gia lớp"));

        Request request = detail.getRequest();

        if (request.getType() != RequestType.JOIN_CLASS) {
            throw new IllegalArgumentException(
                    "Yêu cầu này không phải yêu cầu tham gia lớp");
        }

        if (!request.getReceiver().getUsername().equals(username)) {
            throw new IllegalStateException(
                    "Bạn không có quyền tạo thông báo cho yêu cầu này");
        }

        if (request.getStatus() != RequestStatus.APPROVED) {
            throw new IllegalArgumentException(
                    "Yêu cầu chưa được chấp nhận");
        }

        String classroomName = detail.getClassroom().getName();

        Notification notification = Notification.builder()
                .user(request.getSender())
                .type(NotificationType.REQUEST_APPROVED)
                .title("Yêu cầu tham gia lớp được chấp nhận")
                .message(
                        "Yêu cầu vào lớp "
                                + classroomName
                                + " của bạn đã được chấp nhận")
                .referenceType("REQUEST")
                .referenceId(request.getId())
                .read(false)
                .build();

        notificationRepository.save(notification);
    }


}
