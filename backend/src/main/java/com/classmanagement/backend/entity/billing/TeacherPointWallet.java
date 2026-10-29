package com.classmanagement.backend.entity.billing;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "teacher_point_wallets")
@Getter
@Setter
@NoArgsConstructor
public class TeacherPointWallet {
    @Id
    @Column(name = "teacher_id")
    private Long teacherId;

    @Column(name = "points_balance", nullable = false)
    private long pointsBalance;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Version
    private long version;

    public TeacherPointWallet(Long teacherId) {
        this.teacherId = teacherId;
        this.pointsBalance = 0;
        this.updatedAt = OffsetDateTime.now();
    }
}