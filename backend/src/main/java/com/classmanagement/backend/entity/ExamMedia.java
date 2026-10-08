package com.classmanagement.backend.entity;

import com.classmanagement.backend.entity.enums.ExamMediaStatus;
import com.classmanagement.backend.entity.enums.ExamMediaType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "exam_media")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamMedia {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    @Column(name = "draft_token", nullable = false)
    private UUID draftToken;

    @Column(name = "object_path", nullable = false, unique = true, length = 500)
    private String objectPath;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false, length = 10)
    private ExamMediaType mediaType;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ExamMediaStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id")
    private Exam exam;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "next_cleanup_at", nullable = false)
    private LocalDateTime nextCleanupAt;

    @Column(name = "cleanup_attempts", nullable = false)
    private int cleanupAttempts;
}
