package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.exception.ConflictException;
import com.classmanagement.backend.exception.ExamMediaException;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.exam.ExamMediaRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ExamMediaLifecycle {
    private final ExamMediaRepository mediaRepository;
    private final UserRepository userRepository;
    private final long tempTtlHours;

    public ExamMediaLifecycle(ExamMediaRepository mediaRepository, UserRepository userRepository,
            @Value("${app.exam-media.temp-ttl-hours:24}") long tempTtlHours) {
        if (tempTtlHours <= 0) throw new IllegalArgumentException("TTL media phải lớn hơn 0");
        this.mediaRepository = mediaRepository;
        this.userRepository = userRepository;
        this.tempTtlHours = tempTtlHours;
    }

    @Transactional
    public ExamMedia reserve(String username, UUID draftToken, ExamMediaType type,
            ExamMediaValidator.ValidatedFile file, long size) {
        User teacher = requireTeacher(username);
        UUID id = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();
        String path = "exam-media/gv_" + teacher.getId() + "/" + draftToken + "/"
                + id + "." + file.extension();
        return mediaRepository.save(ExamMedia.builder().id(id).teacher(teacher).draftToken(draftToken)
                .objectPath(path).mediaType(type).contentType(file.contentType()).sizeBytes(size)
                .status(ExamMediaStatus.UPLOADING).createdAt(now).expiresAt(now.plusHours(1))
                .nextCleanupAt(now.plusHours(1)).build());
    }

    @Transactional
    public ExamMedia completeUpload(UUID id) {
        ExamMedia media = locked(id);
        if (media.getStatus() != ExamMediaStatus.UPLOADING) {
            throw new ConflictException("Phiên upload đã hết hạn, vui lòng tải lại tệp");
        }
        media.setStatus(ExamMediaStatus.TEMP);
        media.setExpiresAt(LocalDateTime.now().plusHours(tempTtlHours));
        media.setNextCleanupAt(media.getExpiresAt());
        return media;
    }

    @Transactional
    public void uploadFailed(UUID id) {
        ExamMedia media = locked(id);
        if (media.getStatus() == ExamMediaStatus.UPLOADING) markForDeletion(media);
    }

    @Transactional
    public void deleteTemporary(String username, UUID id) {
        User teacher = requireTeacher(username);
        ExamMedia media = locked(id);
        if (!media.getTeacher().getId().equals(teacher.getId())) throw notFound();
        if (media.getStatus() == ExamMediaStatus.ATTACHED || media.getStatus() == ExamMediaStatus.UPLOADING) {
            throw new ConflictException("Tệp đang upload hoặc đã gắn vào đề thi, không thể xóa tạm");
        }
        // Repeated DELETE must not reset the worker's retry/lease.
        if (media.getStatus() == ExamMediaStatus.TEMP) markForDeletion(media);
    }

    // Used by complete-exam persistence: claim and Exam insert share one transaction.
    @Transactional(propagation = Propagation.MANDATORY)
    public Map<UUID, ExamMedia> claimTemporary(Collection<UUID> ids, Long teacherId,
            UUID draftToken, Exam exam) {
        if (ids.isEmpty()) return Map.of();
        Set<UUID> uniqueIds = new HashSet<>(ids);
        if (uniqueIds.contains(null)) throw new IllegalArgumentException("ID media không hợp lệ");
        List<ExamMedia> mediaFiles = mediaRepository.findAllLockedByIds(uniqueIds);
        if (mediaFiles.size() != uniqueIds.size()) throw notFound();
        LocalDateTime now = LocalDateTime.now();
        Map<UUID, ExamMedia> result = new HashMap<>();
        for (ExamMedia media : mediaFiles) {
            if (!media.getTeacher().getId().equals(teacherId) || !media.getDraftToken().equals(draftToken)) {
                throw notFound();
            }
            if (media.getStatus() != ExamMediaStatus.TEMP || !media.getExpiresAt().isAfter(now)) {
                throw new ConflictException("Media đã hết hạn hoặc không còn thuộc bản nháp");
            }
            media.setStatus(ExamMediaStatus.ATTACHED);
            media.setExam(exam);
            result.put(media.getId(), media);
        }
        return result;
    }

    @Transactional
    public String leaseCleanup(UUID id) {
        ExamMedia media = mediaRepository.findLockedById(id).orElse(null);
        LocalDateTime now = LocalDateTime.now();
        if (media == null || media.getNextCleanupAt().isAfter(now)
                || (media.getStatus() == ExamMediaStatus.ATTACHED && media.getExam() != null)) return null;
        media.setStatus(ExamMediaStatus.DELETE_PENDING);
        media.setCleanupAttempts(Math.min(media.getCleanupAttempts() + 1, 1000000));
        media.setNextCleanupAt(now.plusMinutes(5));
        return media.getObjectPath();
    }

    @Transactional
    public void cleanupSucceeded(UUID id) {
        mediaRepository.findLockedById(id).ifPresent(media -> {
            if (media.getStatus() == ExamMediaStatus.DELETE_PENDING) mediaRepository.delete(media);
        });
    }

    @Transactional
    public void cleanupFailed(UUID id) {
        mediaRepository.findLockedById(id).ifPresent(media -> {
            long retrySeconds = Math.min(3600, 30L << Math.min(media.getCleanupAttempts(), 7));
            if (media.getStatus() == ExamMediaStatus.DELETE_PENDING) {
                media.setNextCleanupAt(LocalDateTime.now().plusSeconds(retrySeconds));
            }
        });
    }

    private User requireTeacher(String username) {
        User teacher = userRepository.findByUsername(username).orElseThrow(ExamMediaLifecycle::notFound);
        if (teacher.getRole() != UserRole.TEACHER || teacher.getStatus() != UserStatus.ACTIVE) {
            throw new ExamMediaException(HttpStatus.FORBIDDEN, "Chỉ giáo viên đang hoạt động được quản lý media đề thi");
        }
        return teacher;
    }

    private ExamMedia locked(UUID id) {
        return mediaRepository.findLockedById(id).orElseThrow(ExamMediaLifecycle::notFound);
    }

    private void markForDeletion(ExamMedia media) {
        media.setStatus(ExamMediaStatus.DELETE_PENDING);
        media.setNextCleanupAt(LocalDateTime.now());
    }

    private static ExamMediaException notFound() {
        return new ExamMediaException(HttpStatus.NOT_FOUND, "Không tìm thấy media thuộc quyền quản lý");
    }
}
