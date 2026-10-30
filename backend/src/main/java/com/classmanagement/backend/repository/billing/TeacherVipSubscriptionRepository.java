package com.classmanagement.backend.repository.billing;

import com.classmanagement.backend.entity.billing.TeacherVipSubscription;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Modifying;

public interface TeacherVipSubscriptionRepository extends JpaRepository<TeacherVipSubscription, Long> {
        boolean existsByTeacherIdAndExpiresAtAfter(Long teacherId, OffsetDateTime now);

        @Modifying
        @Query(value = "insert into teacher_vip_subscriptions (teacher_id, vip_tier, device_limit, expires_at) values (:teacherId, :vipTier, :deviceLimit, :expiresAt) on conflict (teacher_id, vip_tier) do nothing", nativeQuery = true)
        void createIfMissing(
                        @Param("teacherId") Long teacherId,
                        @Param("vipTier") String vipTier,
                        @Param("deviceLimit") int deviceLimit,
                        @Param("expiresAt") OffsetDateTime expiresAt);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select subscription from TeacherVipSubscription subscription where subscription.teacherId = :teacherId and subscription.vipTier = :vipTier")
    Optional<TeacherVipSubscription> findLockedByTeacherAndTier(
            @Param("teacherId") Long teacherId, @Param("vipTier") String vipTier);

    @Query("select subscription from TeacherVipSubscription subscription where subscription.teacherId = :teacherId and subscription.expiresAt > :now order by subscription.deviceLimit desc")
    List<TeacherVipSubscription> findActiveByTeacher(
            @Param("teacherId") Long teacherId, @Param("now") OffsetDateTime now);
}