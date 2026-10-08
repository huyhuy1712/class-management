package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.exam.ExamMediaResponse;
import com.classmanagement.backend.entity.ExamMedia;
import com.classmanagement.backend.entity.enums.ExamMediaType;
import com.classmanagement.backend.exception.ExamMediaException;
import com.classmanagement.backend.service.*;
import com.classmanagement.backend.service.exam.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExamMediaServiceImpl implements ExamMediaService {
    private final StorageService storageService;
    private final ExamMediaValidator validator;
    private final ExamMediaLifecycle lifecycle;

    @Override
    public ExamMediaResponse upload(String username, UUID draftToken, ExamMediaType type, MultipartFile file) {
        if (draftToken == null) throw new IllegalArgumentException("Thiếu draft token");
        var format = validator.validate(type, file);
        // Reservation commits before the provider call so even interrupted uploads are tracked.
        ExamMedia media = lifecycle.reserve(username, draftToken, type, format, file.getSize());
        String path = media.getObjectPath();
        int separator = path.lastIndexOf('/');
        try {
            storageService.upload(path.substring(0, separator), path.substring(separator + 1), file);
            media = lifecycle.completeUpload(media.getId());
        } catch (RuntimeException ex) {
            try {
                lifecycle.uploadFailed(media.getId());
            } catch (RuntimeException cleanupError) {
                // UPLOADING reservation remains eligible for cleanup after its deadline.
                log.warn("Cannot queue failed exam upload {} for cleanup", media.getId());
            }
            throw new ExamMediaException(HttpStatus.BAD_GATEWAY, "Không thể tải media, vui lòng thử lại");
        }
        return new ExamMediaResponse(media.getId(), draftToken, path, storageService.getUrl(path),
                media.getMediaType(), media.getContentType(), media.getSizeBytes(), media.getExpiresAt());
    }

    @Override
    public void deleteTemporary(String username, UUID mediaId) {
        lifecycle.deleteTemporary(username, mediaId);
    }
}
