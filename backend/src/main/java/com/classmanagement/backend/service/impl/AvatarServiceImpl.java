package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.user.AvatarResponse;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.service.AvatarService;
import com.classmanagement.backend.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

@Service
@RequiredArgsConstructor
public class AvatarServiceImpl implements AvatarService {

        private static final long MAX_AVATAR_SIZE = 2 * 1024 * 1024;

        private final UserRepository userRepository;
        private final StorageService storageService;

        @Override
        public AvatarResponse uploadAvatar(
                        String username,
                        MultipartFile file) {

                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Không tìm thấy người dùng"));

                validateFile(file);

                String extension = detectExtension(file);

                // Thêm version để tránh cache ảnh cũ
                String fileName = "avatar_user_"
                                + user.getId()
                                + "_"
                                + System.currentTimeMillis()
                                + "."
                                + extension;

                String oldAvatar = user.getAvatar();

                String newObjectPath = storageService.upload(
                                "avatars",
                                fileName,
                                file);

                try {
                        // DB chỉ lưu object path
                        user.setAvatar(newObjectPath);

                        userRepository.saveAndFlush(user);

                } catch (Exception e) {

                        // DB lỗi → xóa file vừa upload
                        storageService.delete(newObjectPath);

                        throw new IllegalStateException(
                                        "Không thể cập nhật ảnh đại diện");
                }

                String avatarUrl = storageService.getUrl(newObjectPath);

                // Cleanup avatar cũ không nằm trên critical path của response.
                cleanupOldAvatarAsync(oldAvatar);

                return new AvatarResponse(avatarUrl);
        }

        @Override
        public void deleteAvatar(String username) {

                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Không tìm thấy người dùng"));

                String oldAvatar = user.getAvatar();

                if (oldAvatar == null || oldAvatar.isBlank()) {
                        return;
                }

                /*
                 * Update DB trước.
                 * Sau này có thể cải thiện cleanup/retry nếu storage delete lỗi.
                 */
                user.setAvatar(null);
                userRepository.saveAndFlush(user);

                try {
                        storageService.delete(oldAvatar);
                } catch (Exception ignored) {
                        // Có thể log orphan file để cleanup sau.
                }
        }

        private void validateFile(MultipartFile file) {

                if (file == null || file.isEmpty()) {
                        throw new IllegalArgumentException(
                                        "Vui lòng chọn ảnh đại diện");
                }

                if (file.getSize() > MAX_AVATAR_SIZE) {
                        throw new IllegalArgumentException(
                                        "Ảnh đại diện không được vượt quá 2MB");
                }
        }

        private String detectExtension(MultipartFile file) {

                byte[] header = new byte[12];

                try (InputStream input = file.getInputStream()) {
                        int read = input.read(header);

                        // JPEG: FF D8 FF
                        if (read >= 3
                                        && (header[0] & 0xFF) == 0xFF
                                        && (header[1] & 0xFF) == 0xD8
                                        && (header[2] & 0xFF) == 0xFF) {
                                return "jpg";
                        }

                        // PNG: 89 50 4E 47 0D 0A 1A 0A
                        if (read >= 8
                                        && (header[0] & 0xFF) == 0x89
                                        && header[1] == 0x50
                                        && header[2] == 0x4E
                                        && header[3] == 0x47
                                        && header[4] == 0x0D
                                        && header[5] == 0x0A
                                        && header[6] == 0x1A
                                        && header[7] == 0x0A) {
                                return "png";
                        }

                        // WEBP: RIFF....WEBP
                        if (read >= 12
                                        && header[0] == 'R'
                                        && header[1] == 'I'
                                        && header[2] == 'F'
                                        && header[3] == 'F'
                                        && header[8] == 'W'
                                        && header[9] == 'E'
                                        && header[10] == 'B'
                                        && header[11] == 'P') {
                                return "webp";
                        }

                } catch (IOException e) {
                        throw new IllegalStateException("Không thể đọc file ảnh");
                }

                throw new IllegalArgumentException(
                                "Ảnh đại diện chỉ hỗ trợ JPG, PNG hoặc WEBP");
        }

        private void cleanupOldAvatarAsync(String oldAvatar) {
                if (oldAvatar == null || oldAvatar.isBlank()) {
                        return;
                }

                Thread.startVirtualThread(() -> {
                        try {
                                storageService.delete(oldAvatar);
                        } catch (Exception ignored) {
                                // Cleanup lỗi không ảnh hưởng avatar mới.
                        }
                });
        }

}