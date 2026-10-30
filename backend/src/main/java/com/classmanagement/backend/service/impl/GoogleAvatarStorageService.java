package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.service.GoogleAvatarStorage;
import com.classmanagement.backend.service.StorageService;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class GoogleAvatarStorageService implements GoogleAvatarStorage {
    private static final Logger LOGGER = LoggerFactory.getLogger(GoogleAvatarStorageService.class);
    private static final String STORAGE_FOLDER = "avatars/google";
    private static final int MAX_AVATAR_BYTES = 2 * 1024 * 1024;
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();

    private final StorageService storage;

    public GoogleAvatarStorageService(StorageService storage) {
        this.storage = storage;
    }

    @Override
    public void delete(String objectPath) {
        storage.delete(objectPath);
    }

    @Override
    public Optional<String> storeIfNeeded(Long userId, String currentAvatar, String googleAvatarUrl) {
        if (isStoredGoogleAvatar(currentAvatar)
                || (currentAvatar != null && !currentAvatar.isBlank()
                        && !isGoogleAvatarUrl(currentAvatar))
                || !isGoogleAvatarUrl(googleAvatarUrl)) {
            return Optional.empty();
        }

        try {
            DownloadedAvatar avatar = download(googleAvatarUrl);
            String fileName = "google-avatar-" + userId + "-" + UUID.randomUUID() + "." + avatar.extension();
            return Optional.of(storage.upload(
                    STORAGE_FOLDER,
                    fileName,
                    new AvatarMultipartFile(fileName, avatar.contentType(), avatar.bytes())));
        } catch (IOException exception) {
            LOGGER.warn("Unable to download Google avatar for user {}", userId, exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            LOGGER.warn("Google avatar download was interrupted for user {}", userId, exception);
        } catch (IllegalStateException exception) {
            LOGGER.warn("Unable to store Google avatar for user {}", userId, exception);
        }
        return Optional.empty();
    }

    private DownloadedAvatar download(String avatarUrl) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(URI.create(avatarUrl))
                .timeout(Duration.ofSeconds(10))
                .header("Accept", "image/jpeg,image/png,image/webp")
                .GET()
                .build();
        HttpResponse<InputStream> response = HTTP.send(request, HttpResponse.BodyHandlers.ofInputStream());
        try (InputStream body = response.body()) {
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IOException("Google avatar returned HTTP " + response.statusCode());
            }
            String contentType = response.headers()
                    .firstValue("Content-Type")
                    .orElse("")
                    .split(";", 2)[0]
                    .trim()
                    .toLowerCase(Locale.ROOT);
            if (!contentType.equals("image/jpeg")
                    && !contentType.equals("image/png")
                    && !contentType.equals("image/webp")) {
                throw new IOException("Google avatar has an unsupported content type");
            }

            ByteArrayOutputStream output = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int total = 0;
            int read;
            while ((read = body.read(buffer)) != -1) {
                total += read;
                if (total > MAX_AVATAR_BYTES) {
                    throw new IOException("Google avatar exceeds the 2MB size limit");
                }
                output.write(buffer, 0, read);
            }
            byte[] bytes = output.toByteArray();
            String extension = detectExtension(bytes);
            if (!extension.equals(extensionForContentType(contentType))) {
                throw new IOException("Google avatar content does not match its image type");
            }
            return new DownloadedAvatar(bytes, contentType, extension);
        }
    }

    private boolean isGoogleAvatarUrl(String value) {
        if (value == null || value.length() > 1000) return false;
        try {
            URI uri = URI.create(value);
            return "https".equalsIgnoreCase(uri.getScheme())
                    && "lh3.googleusercontent.com".equalsIgnoreCase(uri.getHost())
                    && uri.getUserInfo() == null
                    && uri.getPort() == -1;
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private boolean isStoredGoogleAvatar(String avatar) {
        return avatar != null && avatar.startsWith(STORAGE_FOLDER + "/");
    }

    private String detectExtension(byte[] bytes) throws IOException {
        if (bytes.length >= 3
                && (bytes[0] & 0xff) == 0xff
                && (bytes[1] & 0xff) == 0xd8
                && (bytes[2] & 0xff) == 0xff) {
            return "jpg";
        }
        if (bytes.length >= 8
                && (bytes[0] & 0xff) == 0x89
                && bytes[1] == 'P'
                && bytes[2] == 'N'
                && bytes[3] == 'G'
                && bytes[4] == 0x0d
                && bytes[5] == 0x0a
                && bytes[6] == 0x1a
                && bytes[7] == 0x0a) {
            return "png";
        }
        if (bytes.length >= 12
                && bytes[0] == 'R'
                && bytes[1] == 'I'
                && bytes[2] == 'F'
                && bytes[3] == 'F'
                && bytes[8] == 'W'
                && bytes[9] == 'E'
                && bytes[10] == 'B'
                && bytes[11] == 'P') {
            return "webp";
        }
        throw new IOException("Google returned invalid avatar image data");
    }

    private String extensionForContentType(String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> "jpg";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            default -> "";
        };
    }

    private record DownloadedAvatar(byte[] bytes, String contentType, String extension) {}

    private static final class AvatarMultipartFile implements MultipartFile {
        private final String fileName;
        private final String contentType;
        private final byte[] bytes;

        private AvatarMultipartFile(String fileName, String contentType, byte[] bytes) {
            this.fileName = fileName;
            this.contentType = contentType;
            this.bytes = bytes;
        }

        @Override
        public String getName() {
            return "file";
        }

        @Override
        public String getOriginalFilename() {
            return fileName;
        }

        @Override
        public String getContentType() {
            return contentType;
        }

        @Override
        public boolean isEmpty() {
            return bytes.length == 0;
        }

        @Override
        public long getSize() {
            return bytes.length;
        }

        @Override
        public byte[] getBytes() {
            return bytes.clone();
        }

        @Override
        public InputStream getInputStream() {
            return new ByteArrayInputStream(bytes);
        }

        @Override
        public void transferTo(File destination) throws IOException {
            java.nio.file.Files.write(destination.toPath(), bytes);
        }

        @Override
        public void transferTo(java.nio.file.Path destination) throws IOException {
            java.nio.file.Files.write(destination, bytes);
        }
    }
}
