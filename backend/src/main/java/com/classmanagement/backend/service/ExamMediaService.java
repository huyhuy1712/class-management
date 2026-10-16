package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.exam.ExamMediaResponse;
import com.classmanagement.backend.entity.enums.ExamMediaType;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;
import java.util.Map;

public interface ExamMediaService {
    ExamMediaResponse upload(String username, UUID draftToken, ExamMediaType type, MultipartFile file);
    /** Internal entry point for reviewed illustrations, never private PDF source references. */
    ExamMediaResponse uploadGeneratedImage(String username, UUID draftToken, byte[] png);
    Map<UUID, ExamMediaResponse> uploadGeneratedImages(
            String username, UUID draftToken, Map<UUID, byte[]> images);
    void deleteTemporary(String username, UUID mediaId);
}
