package com.classmanagement.backend.service.impl.material;

import com.classmanagement.backend.service.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class MaterialFileSupport {
    private static final long MAX_DOCUMENT_SIZE = 10L * 1024 * 1024;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "ppt", "pptx", "doc", "docx", "xls", "xlsx", "txt", "zip");

    private final StorageService storageService;

    public String validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn tệp tài liệu");
        }
        if (file.getSize() > MAX_DOCUMENT_SIZE) {
            throw new ResponseStatusException(
                    HttpStatus.PAYLOAD_TOO_LARGE, "Tệp tài liệu không được vượt quá 10 MB");
        }
        String originalName = file.getOriginalFilename();
        String baseName = originalName == null ? "" : originalName.replace('\\', '/');
        int separator = baseName.lastIndexOf('/');
        int extensionIndex = baseName.lastIndexOf('.');
        String extension = extensionIndex > separator
                ? baseName.substring(extensionIndex + 1).toLowerCase(Locale.ROOT)
                : "";
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Chỉ hỗ trợ PDF, Word, PowerPoint, Excel, TXT hoặc ZIP");
        }
        return extension;
    }

    public String originalFileName(MultipartFile file) {
        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) {
            return "document";
        }
        String baseName = originalName.replace('\\', '/');
        return baseName.substring(baseName.lastIndexOf('/') + 1);
    }

    public void validateOriginalFileName(String originalName) {
        if (originalName.length() > 255) {
            throw new IllegalArgumentException("Tên tệp không được vượt quá 255 ký tự");
        }
    }

    public String contentTypeFor(String extension) {
        return switch (extension) {
            case "pdf" -> "application/pdf";
            case "doc" -> "application/msword";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "ppt" -> "application/vnd.ms-powerpoint";
            case "pptx" -> "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            case "xls" -> "application/vnd.ms-excel";
            case "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case "txt" -> "text/plain";
            case "zip" -> "application/zip";
            default -> "application/octet-stream";
        };
    }

    public MultipartFile withContentType(MultipartFile file, String contentType) {
        return new TypedMultipartFile(file, contentType);
    }

    public void scheduleDelete(String objectPath) {
        if (objectPath == null || objectPath.isBlank()) {
            return;
        }
        Runnable delete = () -> {
            try {
                storageService.delete(objectPath);
            } catch (RuntimeException error) {
                log.error("Could not remove material object from storage: {}", objectPath, error);
            }
        };
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    delete.run();
                }
            });
        } else {
            delete.run();
        }
    }

    private record TypedMultipartFile(MultipartFile delegate, String contentType) implements MultipartFile {
        @Override
        public String getName() {
            return delegate.getName();
        }

        @Override
        public String getOriginalFilename() {
            return delegate.getOriginalFilename();
        }

        @Override
        public String getContentType() {
            return contentType;
        }

        @Override
        public boolean isEmpty() {
            return delegate.isEmpty();
        }

        @Override
        public long getSize() {
            return delegate.getSize();
        }

        @Override
        public byte[] getBytes() throws IOException {
            return delegate.getBytes();
        }

        @Override
        public InputStream getInputStream() throws IOException {
            return delegate.getInputStream();
        }

        @Override
        public void transferTo(File destination) throws IOException, IllegalStateException {
            delegate.transferTo(destination);
        }
    }
}
