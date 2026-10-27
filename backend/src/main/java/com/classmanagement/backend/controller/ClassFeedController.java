package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.feed.ClassFeedPostPageResponse;
import com.classmanagement.backend.dto.feed.ClassFeedPostRequest;
import com.classmanagement.backend.dto.feed.ClassFeedPostResponse;
import com.classmanagement.backend.service.feed.ClassFeedService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/classes/{classroomId}/feed/posts")
@RequiredArgsConstructor
@Validated
public class ClassFeedController {

    private final ClassFeedService classFeedService;

    @GetMapping
    public ClassFeedPostPageResponse getPosts(
            @PathVariable Long classroomId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int size,
            Authentication authentication) {
        return classFeedService.getPosts(classroomId, authentication.getName(), page, size);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClassFeedPostResponse createPost(
            @PathVariable Long classroomId,
            @Valid @RequestBody ClassFeedPostRequest request,
            Authentication authentication) {
        return classFeedService.createPost(classroomId, request, authentication.getName());
    }

    @PutMapping("/{postId}")
    public ClassFeedPostResponse updatePost(
            @PathVariable Long classroomId,
            @PathVariable Long postId,
            @Valid @RequestBody ClassFeedPostRequest request,
            Authentication authentication) {
        return classFeedService.updatePost(classroomId, postId, request, authentication.getName());
    }
}
