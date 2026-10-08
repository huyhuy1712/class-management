package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.service.StorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
public class LocalStorageService implements StorageService {

    @Value("${app.storage.local-dir}")
    private String localDir;

    @Value("${app.storage.local-base-url}")
    private String baseUrl;

    @Override
    public String upload(
            String folder,
            String fileName,
            MultipartFile file) {
        try {
            Path directory = Paths.get(localDir, folder)
                    .toAbsolutePath()
                    .normalize();

            Files.createDirectories(directory);

            Path target = directory
                    .resolve(fileName)
                    .normalize();

            // Không cho path traversal ra ngoài folder
            if (!target.startsWith(directory)) {
                throw new IllegalArgumentException(
                        "Đường dẫn file không hợp lệ");
            }

            try (var input = file.getInputStream()) {
                Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
            }

            return folder + "/" + fileName;

        } catch (IOException e) {
            throw new IllegalStateException(
                    "Không thể lưu file");
        }
    }

    @Override
    public void delete(String objectPath) {

        if (objectPath == null || objectPath.isBlank()) {
            return;
        }

        try {
            Path root = Paths.get(localDir)
                    .toAbsolutePath()
                    .normalize();

            Path target = root
                    .resolve(objectPath)
                    .normalize();

            if (!target.startsWith(root)) {
                throw new IllegalArgumentException(
                        "Đường dẫn file không hợp lệ");
            }

            Files.deleteIfExists(target);

        } catch (IOException e) {
            throw new IllegalStateException(
                    "Không thể xóa file");
        }
    }

    @Override
    public String getUrl(String objectPath) {

        if (objectPath == null || objectPath.isBlank()) {
            return null;
        }

        return baseUrl
                + "/uploads/"
                + objectPath.replace("\\", "/");
    }
}
