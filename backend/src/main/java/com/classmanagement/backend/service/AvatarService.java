package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.user.AvatarResponse;
import org.springframework.web.multipart.MultipartFile;

public interface AvatarService {

    AvatarResponse uploadAvatar(
            String username,
            MultipartFile file);

    void deleteAvatar(String username);
}