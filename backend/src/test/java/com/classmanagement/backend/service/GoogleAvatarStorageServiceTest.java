package com.classmanagement.backend.service;

import com.classmanagement.backend.service.impl.GoogleAvatarStorageService;
import java.lang.reflect.Proxy;
import java.util.Optional;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class GoogleAvatarStorageServiceTest {
    @Test
    void reusesStoredGoogleAvatarWithoutFetchingOrUploadingAgain() {
        GoogleAvatarStorageService service = new GoogleAvatarStorageService(storage());

        assertTrue(service.storeIfNeeded(
                8L,
                "avatars/google/google-avatar-8.jpg",
                "https://lh3.googleusercontent.com/current-avatar").isEmpty());
    }

    @Test
    void keepsUserUploadedAvatarInsteadOfReplacingItWithGoogleAvatar() {
        GoogleAvatarStorageService service = new GoogleAvatarStorageService(storage());

        assertTrue(service.storeIfNeeded(
                8L,
                "avatars/avatar_user_8_123.jpg",
                "https://lh3.googleusercontent.com/current-avatar").isEmpty());
    }

    @Test
    void keepsUserUploadedAvatarStorageUrlInsteadOfReplacingItWithGoogleAvatar() {
        GoogleAvatarStorageService service = new GoogleAvatarStorageService(storage());

        assertTrue(service.storeIfNeeded(
                8L,
                "https://storage.example.com/public/avatars/avatar_user_8_123.jpg",
                "https://lh3.googleusercontent.com/current-avatar").isEmpty());
    }

    @Test
    void rejectsPictureUrlsOutsideGoogleImageHost() {
        GoogleAvatarStorageService service = new GoogleAvatarStorageService(storage());

        assertTrue(service.storeIfNeeded(
                8L,
                null,
                "https://example.com/avatar.jpg").isEmpty());
    }

    private static StorageService storage() {
        return (StorageService) Proxy.newProxyInstance(
                StorageService.class.getClassLoader(),
                new Class<?>[] {StorageService.class},
                (proxy, method, args) -> {
                    if (method.getName().equals("upload")) {
                        throw new AssertionError("Avatar should not be uploaded in this test");
                    }
                    if (method.getName().equals("getUrl")) return args[0];
                    if (method.getName().equals("toString")) return "storage";
                    if (method.getName().equals("hashCode")) return System.identityHashCode(proxy);
                    if (method.getName().equals("equals")) return proxy == args[0];
                    return Optional.empty();
                });
    }
}
