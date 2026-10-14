package com.classmanagement.backend.service;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {

    String upload(
            String folder,
            String fileName,
            MultipartFile file);

    void delete(String objectPath);

    default void copy(String sourcePath, String targetPath) {
        throw new UnsupportedOperationException("Storage chưa hỗ trợ sao chép tệp");
    }

    String getUrl(String objectPath);
}
