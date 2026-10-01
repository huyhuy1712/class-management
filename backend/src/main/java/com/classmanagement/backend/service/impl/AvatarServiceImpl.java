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

                // DB update thành công rồi mới xóa avatar cũ
                if (oldAvatar != null && !oldAvatar.isBlank()) {
                        try {
                                storageService.delete(oldAvatar);
                        } catch (Exception ignored) {
                                // Không rollback avatar mới chỉ vì cleanup ảnh cũ lỗi.
                                // Sau này có thể thêm log.
                        }
                }

                String avatarUrl = storageService.getUrl(newObjectPath);

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

                try {
                        byte[] bytes = file.getBytes();

                        // JPEG: FF D8 FF
                        if (bytes.length >= 3
                                        && (bytes[0] & 0xFF) == 0xFF
                                        && (bytes[1] & 0xFF) == 0xD8
                                        && (bytes[2] & 0xFF) == 0xFF) {

                                return "jpg";
                        }

                        // PNG: 89 50 4E 47 0D 0A 1A 0A
                        if (bytes.length >= 8
                                        && (bytes[0] & 0xFF) == 0x89
                                        && bytes[1] == 0x50
                                        && bytes[2] == 0x4E
                                        && bytes[3] == 0x47
                                        && bytes[4] == 0x0D
                                        && bytes[5] == 0x0A
                                        && bytes[6] == 0x1A
                                        && bytes[7] == 0x0A) {

                                return "png";
                        }

                        // WEBP: RIFF....WEBP
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

                } catch (IOException e) {
                        throw new IllegalStateException(
                                        "Không thể đọc file ảnh");
                }

                throw new IllegalArgumentException(
                                "Ảnh đại diện chỉ hỗ trợ JPG, PNG hoặc WEBP");
        }
}