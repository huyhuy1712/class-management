package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.service.StorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.DirectoryNotEmptyException;
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
        if (StorageService.isAbsoluteUrl(objectPath)) {
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
            deleteEmptyMaterialFolders(root, target.getParent());

        } catch (IOException e) {
            throw new IllegalStateException(
                    "Không thể xóa file");
        }
    }

    private void deleteEmptyMaterialFolders(Path root, Path directory) throws IOException {
        Path materialsRoot = root.resolve("materials").resolve("teachers").normalize();
        Path current = directory;
        while (current != null && current.startsWith(materialsRoot) && !current.equals(materialsRoot)) {
            try {
                Files.deleteIfExists(current);
                current = current.getParent();
            } catch (DirectoryNotEmptyException e) {
                break;
            }
        }
    }

    @Override
    public String getUrl(String objectPath) {

        if (objectPath == null || objectPath.isBlank()) {
            return null;
        }
        if (StorageService.isAbsoluteUrl(objectPath)) {
            return objectPath;
        }

        return baseUrl
                + "/uploads/"
                + objectPath.replace("\\", "/");
    }

    @Override
    public void copy(String sourcePath, String targetPath) {
        Path root = Paths.get(localDir).toAbsolutePath().normalize();
        Path source = root.resolve(sourcePath).normalize();
        Path target = root.resolve(targetPath).normalize();
        if (!source.startsWith(root) || !target.startsWith(root) || source.equals(target)) {
            throw new IllegalArgumentException("Đường dẫn sao chép không hợp lệ");
        }
        try {
            Files.createDirectories(target.getParent());
            Files.copy(source, target);
        } catch (IOException e) {
            throw new IllegalStateException("Không thể sao chép tệp đề thi", e);
        }
    }
}
