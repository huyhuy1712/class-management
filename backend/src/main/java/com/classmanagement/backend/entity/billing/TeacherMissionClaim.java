package com.classmanagement.backend.entity.billing;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "teacher_mission_claims")
@Getter
@Setter
@NoArgsConstructor
public class TeacherMissionClaim {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "teacher_id", nullable = false)
    private Long teacherId;

    @Column(name = "mission_code", nullable = false)
    private String missionCode;

    @Column(name = "reward_points", nullable = false)
    private int rewardPoints;

    @Column(name = "claimed_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime claimedAt;
}
