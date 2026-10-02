package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.entity.ClassJoinRequestDetail;
import com.classmanagement.backend.entity.Notification;
import com.classmanagement.backend.entity.Request;
import com.classmanagement.backend.entity.enums.NotificationType;
import com.classmanagement.backend.entity.enums.RequestStatus;
import com.classmanagement.backend.entity.enums.RequestType;
import com.classmanagement.backend.repository.ClassJoinRequestDetailRepository;
import com.classmanagement.backend.repository.NotificationRepository;
import com.classmanagement.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final ClassJoinRequestDetailRepository classJoinRequestDetailRepository;
    private final NotificationRepository notificationRepository;

@Override
@Transactional
public void createJoinClassRejectedNotification(
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

        if (request.getStatus() != RequestStatus.REJECTED) {
            throw new IllegalArgumentException(
                    "Yêu cầu chưa bị từ chối");
        }

        String classroomName = detail.getClassroom().getName();

        Notification notification = Notification.builder()
                .user(request.getSender())
                .type(NotificationType.REQUEST_REJECTED)
                .title("Yêu cầu tham gia lớp bị từ chối")
                .message(
                        "Yêu cầu vào lớp "
                                + classroomName
                                + " của bạn đã bị từ chối")
                .referenceType("REQUEST")
                .referenceId(request.getId())
                .read(false)
                .build();

        notificationRepository.save(notification);
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