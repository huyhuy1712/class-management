package com.classmanagement.backend.entity;

import com.classmanagement.backend.entity.enums.ClassroomStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "classes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Classroom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
        name = "name",
        nullable = false,
        length = 100
    )
    private String name;

    @Column(
        name = "code",
        nullable = false,
        unique = true,
        length = 50
    )
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "subject_id",
        nullable = false
    )
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "teacher_id",
        nullable = false
    )
    private User teacher;

    @Column(name = "academic_year",nullable = false, length = 9)
    private String academicYear;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(
        name = "status",
        nullable = false,
        length = 20
    )
    private ClassroomStatus status;

    @Column(
        name = "created_at",
        nullable = false,
        updatable = false
    )
    private LocalDateTime createdAt;

    @Column(
        name = "updated_at",
        nullable = false
    )
    private LocalDateTime updatedAt;

    @PrePersist
protected void onCreate() {
    LocalDateTime now = LocalDateTime.now();
    createdAt = now;
    updatedAt = now;
}

@PreUpdate
protected void onUpdate() {
    updatedAt = LocalDateTime.now();
}

}



