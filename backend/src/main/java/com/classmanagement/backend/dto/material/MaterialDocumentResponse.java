package com.classmanagement.backend.dto.material;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter
@Builder
public class MaterialDocumentResponse {
    private Long id;
    private String title;
    private String content;
    private String fileUrl;
    private String fileName;
    private Long fileSize;
    private String fileContentType;
    private String source;
    private String targetType;
    private List<Long> classIds;
    private List<Long> excludedClassIds;
    private List<Long> studentIds;
    private Map<Long, Long> studentClassIds;
    private LocalDateTime createdAt;
}
