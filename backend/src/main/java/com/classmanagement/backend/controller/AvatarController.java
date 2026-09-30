package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.user.AvatarResponse;
import com.classmanagement.backend.service.AvatarService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users/me/avatar")
@RequiredArgsConstructor
public class AvatarController {

    private final AvatarService avatarService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AvatarResponse> uploadAvatar(
            Authentication authentication,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(
                avatarService.uploadAvatar(
                        authentication.getName(),
                        file));
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAvatar(
            Authentication authentication) {

        avatarService.deleteAvatar(
                authentication.getName());

        return ResponseEntity.noContent().build();
    }
}