package com.classmanagement.backend.repository;

import com.classmanagement.backend.entity.Notification;
import com.classmanagement.backend.entity.enums.NotificationType;

import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {
}