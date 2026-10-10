package com.classmanagement.backend.repository;

import com.classmanagement.backend.entity.Notification;
import com.classmanagement.backend.dto.notification.NotificationResponse;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {
    @Query("""
            select new com.classmanagement.backend.dto.notification.NotificationResponse(
                n.id, n.type, n.title, n.message, n.referenceType, n.referenceId, n.read, n.createdAt)
            from Notification n
            where n.user.username = :username
            order by n.createdAt desc, n.id desc
            """)
    List<NotificationResponse> findResponsesByUsername(@Param("username") String username);

    @Modifying
    @Query("""
            delete from Notification n where n.id = :id
            and n.user.id in (select u.id from User u where u.username = :username)
            """)
    int deleteOwnedNotification(@Param("id") Long id, @Param("username") String username);

    @Modifying
    @Query("""
            update Notification n set n.read = :read where n.id = :id
            and n.user.id in (select u.id from User u where u.username = :username)
            """)
    int updateOwnedReadStatus(@Param("id") Long id, @Param("username") String username,
                             @Param("read") boolean read);
}
