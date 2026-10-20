package com.classmanagement.backend.service;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {

    static boolean isAbsoluteUrl(String value) {
        return value != null
                && (value.regionMatches(true, 0, "https://", 0, 8)
                        || value.regionMatches(true, 0, "http://", 0, 7));
    }

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
