package com.classmanagement.backend.service;

import java.util.Optional;

public interface GoogleAvatarStorage {
    Optional<String> storeIfNeeded(Long userId, String currentAvatar, String googleAvatarUrl);

    void delete(String objectPath);
}
