package com.classmanagement.backend.service;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {

    String upload(
            String folder,
            String fileName,
            MultipartFile file);

    void delete(String objectPath);

    String getUrl(String objectPath);
}