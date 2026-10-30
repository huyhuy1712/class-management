package com.classmanagement.backend.service.homework.notifications;

import com.classmanagement.backend.entity.Notification;
import com.classmanagement.backend.entity.enums.NotificationType;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.repository.NotificationRepository;
import com.classmanagement.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class HomeworkNotificationService {
    private final UserRepository users;
    private final NotificationRepository notifications;

    public void notifyNewAssignment(long assignmentId, String title, Set<Long> studentIds) {
        var newNotifications = new ArrayList<Notification>();
        for (Long studentId : studentIds) {
            var student = users.findById(studentId).orElse(null);
            if (student == null || student.getRole() != UserRole.STUDENT || student.getStatus() != UserStatus.ACTIVE)
                continue;
            newNotifications.add(Notification.builder()
                    .user(student)
                    .type(NotificationType.HOMEWORK_NEW)
                    .title("Bài tập mới: " + title)
                    .message("Giáo viên vừa giao bài tập mới. Bấm để xem và bắt đầu làm bài.")
                    .referenceType("HOMEWORK")
                    .referenceId(assignmentId)
                    .build());
        }
        if (!newNotifications.isEmpty()) notifications.saveAll(newNotifications);
    }
}
