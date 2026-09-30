package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.user.UpdateProfileRequest;
import com.classmanagement.backend.dto.user.UserResponse;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

@GetMapping
public ResponseEntity<List<UserResponse>> getAllUsers(
            @RequestParam(required = false) UserRole role
    ) {

        return ResponseEntity.ok(
                userService.getAllUsers(role)
    );
}

@PutMapping("/me")
public ResponseEntity<UserResponse> updateMyProfile(
        Authentication authentication,
        @Valid @RequestBody UpdateProfileRequest request) {
return ResponseEntity.ok(
        userService.updateMyProfile(
                authentication.getName(),
                request));
}

@GetMapping("/{userId}")
public ResponseEntity<UserResponse> getUserById(
        @PathVariable Long userId) {
    return ResponseEntity.ok(
            userService.getUserById(userId));
}


}