package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.user.AvatarResponse;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.service.AvatarService;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AvatarServiceImpl implements AvatarService {

    private final UserRepository userRepository;

    @Value("${app.avatar.upload-dir}")
    private String uploadDir;

    @Value("${app.avatar.base-url}")
    private String baseUrl;

    private static final long MAX_FILE_SIZE = 2 * 1024 * 1024;

    @Override
    public AvatarResponse uploadAvatar(
            String username,
            MultipartFile file) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy người dùng"));

        validateFile(file);

        Path directory = Path.of(uploadDir)
                .toAbsolutePath()
                .normalize();

        Path tempFile = null;

        try {
            Files.createDirectories(directory);

            // Kiểm tra nội dung thực tế và lấy đuôi ảnh
            String extension = detectImageExtension(file);

            String fileName = "avatar_user_"
                    + user.getId()
                    + "."
                    + extension;

            Path target = directory.resolve(fileName);

            // Ghi vào file tạm, không ghi đè ảnh cũ ngay
            tempFile = Files.createTempFile(
                    directory,
                    "avatar-upload-",
                    ".tmp");

            try (InputStream input = file.getInputStream()) {
                Files.copy(
                        input,
                        tempFile,
                        StandardCopyOption.REPLACE_EXISTING);
            }

            // Giữ lại ảnh cũ nếu cần rollback
            Path backup = null;

            if (Files.exists(target)) {
                backup = Files.createTempFile(
                        directory,
                        "avatar-backup-",
                        ".tmp");

                Files.copy(
                        target,
                        backup,
                        StandardCopyOption.REPLACE_EXISTING);
            }

            String oldAvatar = user.getAvatar();

            try {
                Files.move(
                        tempFile,
                        target,
                        StandardCopyOption.REPLACE_EXISTING);

                String avatarUrl = baseUrl.replaceAll("/+$", "")
                        + "/uploads/avatars/"
                        + fileName
                        + "?v="
                        + System.currentTimeMillis();

                user.setAvatar(avatarUrl);
                userRepository.saveAndFlush(user);

                // Xóa ảnh cũ nếu khác định dạng
                deleteOldAvatarFile(
                        directory,
                        user.getId(),
                        fileName);

                if (backup != null) {
                    Files.deleteIfExists(backup);
                }

                return new AvatarResponse(avatarUrl);

            } catch (Exception e) {
                // Khôi phục file cũ nếu cập nhật thất bại
                if (backup != null) {
                    Files.move(
                            backup,
                            target,
                            StandardCopyOption.REPLACE_EXISTING);
                } else {
                    Files.deleteIfExists(target);
                }

                user.setAvatar(oldAvatar);

                throw e;
            }

        } catch (IOException e) {
            throw new IllegalStateException(
                    "Không thể lưu ảnh đại diện",
                    e);
        } finally {
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (IOException ignored) {
                    // Có thể ghi log dọn file tạm
                }
            }
        }
    }

   private void validateFile(MultipartFile file) {
    if (file == null || file.isEmpty()) {
        throw new IllegalArgumentException(
                "Vui lòng chọn ảnh đại diện"
        );
    }

    if (file.getSize() > MAX_FILE_SIZE) {
        throw new IllegalArgumentException(
                "Ảnh đại diện không được vượt quá 2 MB"
        );
    }
}

private String detectImageExtension(
        MultipartFile file
) throws IOException {

    byte[] header;

    try (InputStream input = file.getInputStream()) {
        header = input.readNBytes(12);
    }

    // JPEG: FF D8 FF
    if (header.length >= 3
            && (header[0] & 0xFF) == 0xFF
            && (header[1] & 0xFF) == 0xD8
            && (header[2] & 0xFF) == 0xFF) {
        return "jpg";
    }

    // PNG signature
    byte[] png = {
            (byte) 0x89, 0x50, 0x4E, 0x47,
            0x0D, 0x0A, 0x1A, 0x0A
    };

    if (header.length >= 8
            && Arrays.equals(
                    Arrays.copyOf(header, 8),
                    png
            )) {
        return "png";
    }

    // WebP: RIFF....WEBP
    if (header.length >= 12
            && new String(
                    header, 0, 4,
                    StandardCharsets.US_ASCII
            ).equals("RIFF")
            && new String(
                    header, 8, 4,
                    StandardCharsets.US_ASCII
            ).equals("WEBP")) {
        return "webp";
    }

    throw new IllegalArgumentException(
            "Chỉ chấp nhận ảnh JPG, PNG hoặc WebP hợp lệ"
    );
}

private void deleteOldAvatarFile(
        Path directory,
        Long userId,
        String currentFileName
) throws IOException {

    for (String extension : List.of(
            "jpg", "png", "webp"
    )) {
        String fileName = "avatar_user_"
                + userId
                + "."
                + extension;

        if (!fileName.equals(currentFileName)) {
            Files.deleteIfExists(
                    directory.resolve(fileName)
            );
        }
    }
}

@Override
public void deleteAvatar(String username) {

    User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException(
                    "Không tìm thấy người dùng"));

    Path directory = Path.of(uploadDir)
            .toAbsolutePath()
            .normalize();

    try {
        // Xóa các file avatar của user
        for (String extension : List.of("jpg", "png", "webp")) {

            String fileName = "avatar_user_"
                    + user.getId()
                    + "."
                    + extension;

            Files.deleteIfExists(
                    directory.resolve(fileName));
        }

        // Xóa URL avatar trong database
        user.setAvatar(null);
        userRepository.save(user);

    } catch (IOException e) {
        throw new IllegalStateException(
                "Không thể xóa ảnh đại diện",
                e);
    }
}

}