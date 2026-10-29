package com.classmanagement.backend.entity.billing;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "teacher_point_ledger")
@Getter
@Setter
@NoArgsConstructor
public class TeacherPointLedgerEntry {
    public enum Type {
        CREDIT,
        DEBIT
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "teacher_id", nullable = false)
    private Long teacherId;

    @Column(name = "event_key", nullable = false, unique = true)
    private String eventKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false)
    private Type entryType;

    @Column(nullable = false)
    private long points;

    @Column(nullable = false)
    private String reason;

    @Column(name = "order_id")
    private UUID orderId;

    @Column(name = "balance_after", nullable = false)
    private long balanceAfter;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;
}