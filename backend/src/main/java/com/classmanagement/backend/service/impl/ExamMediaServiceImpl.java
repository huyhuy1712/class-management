package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.service.exam.media.ExamMediaLifecycle;
import com.classmanagement.backend.service.exam.media.ExamMediaValidator;

import com.classmanagement.backend.dto.exam.ExamMediaResponse;
import com.classmanagement.backend.entity.ExamMedia;
import com.classmanagement.backend.entity.enums.ExamMediaType;
import com.classmanagement.backend.exception.ExamMediaException;
import com.classmanagement.backend.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;
import java.util.Map;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.io.*;
import java.nio.file.Files;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExamMediaServiceImpl implements ExamMediaService {
    private final StorageService storageService;
    private final ExamMediaValidator validator;
    private final ExamMediaLifecycle lifecycle;

    @Override
    public ExamMediaResponse uploadGeneratedImage(String username, UUID draftToken, byte[] png) {
        if (png == null) throw new IllegalArgumentException("Thiếu dữ liệu ảnh");
        // Keep validation, reservation, storage and failure cleanup identical to a normal upload.
        return upload(username, draftToken, ExamMediaType.IMAGE, new GeneratedImage(png));
    }

    @Override
    public Map<UUID, ExamMediaResponse> uploadGeneratedImages(
            String username, UUID draftToken, Map<UUID, byte[]> images) {
        if (images.size() > 150) {
            throw new IllegalArgumentException("Quá nhiều ảnh import");
        }
        if (images.isEmpty()) return Map.of();
        var files = new LinkedHashMap<UUID, MultipartFile>();
        var formats = new ArrayList<ExamMediaLifecycle.GeneratedFile>();
        long total = 0;
        for (var entry : images.entrySet()) {
            if (entry.getKey() == null || entry.getValue() == null) {
                throw new IllegalArgumentException("Ảnh import không hợp lệ");
            }
            var file = new GeneratedImage(entry.getValue());
            total += file.getSize();
            if (total > 32L * 1024 * 1024) {
                throw new IllegalArgumentException("Lô ảnh vượt 32 MiB");
            }
            files.put(entry.getKey(), file);
            formats.add(new ExamMediaLifecycle.GeneratedFile(entry.getKey(), file.getSize(),
                    validator.validate(ExamMediaType.IMAGE, file)));
        }
        var reserved = lifecycle.reserveGeneratedBatch(username, draftToken, formats);
        var ids = reserved.values().stream().map(ExamMedia::getId).toList();
        try {
            for (var entry : reserved.entrySet()) {
                var media = entry.getValue();
                var path = media.getObjectPath();
                int separator = path.lastIndexOf('/');
                storageService.upload(path.substring(0, separator), path.substring(separator + 1),
                        files.get(entry.getKey()));
            }
            var expiry = lifecycle.completeGeneratedBatch(ids);
            var result = new LinkedHashMap<UUID, ExamMediaResponse>();
            reserved.forEach((sourceId, media) -> result.put(sourceId,
                    new ExamMediaResponse(media.getId(), draftToken, media.getObjectPath(),
                            storageService.getUrl(media.getObjectPath()), media.getMediaType(),
                            media.getContentType(), media.getSizeBytes(), expiry)));
            return Map.copyOf(result);
        } catch (RuntimeException error) {
            try {
                lifecycle.generatedBatchFailed(ids);
            } catch (RuntimeException cleanupError) {
                log.warn("Generated image batch remains tracked for expiry cleanup");
            }
            throw new ExamMediaException(HttpStatus.BAD_GATEWAY, "Không chuyển được lô ảnh import");
        }
    }

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

    private static final class GeneratedImage implements MultipartFile {
        private final byte[] data;
        GeneratedImage(byte[] data) { this.data = data.clone(); }
        @Override public String getName() { return "file"; }
        @Override public String getOriginalFilename() { return "import.png"; }
        @Override public String getContentType() { return "image/png"; }
        @Override public boolean isEmpty() { return data.length == 0; }
        @Override public long getSize() { return data.length; }
        @Override public byte[] getBytes() { return data.clone(); }
        @Override public InputStream getInputStream() { return new ByteArrayInputStream(data); }
        @Override public void transferTo(File destination) throws IOException { Files.write(destination.toPath(), data); }
    }
}
