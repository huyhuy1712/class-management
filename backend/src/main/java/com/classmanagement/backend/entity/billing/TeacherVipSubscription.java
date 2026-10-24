package com.classmanagement.backend.entity.billing;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "teacher_vip_subscriptions")
@Getter
@Setter
@NoArgsConstructor
public class TeacherVipSubscription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "teacher_id", nullable = false)
    private Long teacherId;

    @Column(name = "vip_tier", nullable = false)
    private String vipTier;

    @Column(name = "device_limit", nullable = false)
    private int deviceLimit;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "last_order_id")
    private UUID lastOrderId;

    @Column(name = "updated_at", nullable = false, insertable = false)
    private OffsetDateTime updatedAt;
}