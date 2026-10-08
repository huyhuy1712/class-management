package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.exam.ExamMediaResponse;
import com.classmanagement.backend.entity.enums.ExamMediaType;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;

public interface ExamMediaService {
    ExamMediaResponse upload(String username, UUID draftToken, ExamMediaType type, MultipartFile file);
    void deleteTemporary(String username, UUID mediaId);
}
