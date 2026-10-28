package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.feed.ClassFeedCommentPageResponse;
import com.classmanagement.backend.dto.feed.ClassFeedCommentRequest;
import com.classmanagement.backend.dto.feed.ClassFeedCommentResponse;
import com.classmanagement.backend.dto.feed.ClassFeedPostPageResponse;
import com.classmanagement.backend.dto.feed.ClassFeedPostRequest;
import com.classmanagement.backend.dto.feed.ClassFeedPostResponse;
import com.classmanagement.backend.dto.feed.ClassFeedPostVoteRequest;
import com.classmanagement.backend.dto.feed.ClassFeedPostVoteResponse;
import com.classmanagement.backend.dto.feed.FeedEmojiReactionRequest;
import com.classmanagement.backend.dto.feed.FeedEmojiReactionSummary;
import com.classmanagement.backend.service.feed.ClassFeedService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.List;

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

    @DeleteMapping("/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePost(
            @PathVariable Long classroomId,
            @PathVariable Long postId,
            Authentication authentication) {
        classFeedService.deletePost(classroomId, postId, authentication.getName());
    }

    @PutMapping("/{postId}/vote")
    public ClassFeedPostVoteResponse setPostVote(
            @PathVariable Long classroomId,
            @PathVariable Long postId,
            @Valid @RequestBody ClassFeedPostVoteRequest request,
            Authentication authentication) {
        return classFeedService.setPostVote(classroomId, postId, request, authentication.getName());
    }

    @DeleteMapping("/{postId}/vote")
    public ClassFeedPostVoteResponse clearPostVote(
            @PathVariable Long classroomId,
            @PathVariable Long postId,
            Authentication authentication) {
        return classFeedService.clearPostVote(classroomId, postId, authentication.getName());
    }

    @PutMapping("/{postId}/reactions/emoji")
    public List<FeedEmojiReactionSummary> setPostEmoji(
            @PathVariable Long classroomId,
            @PathVariable Long postId,
            @Valid @RequestBody FeedEmojiReactionRequest request,
            Authentication authentication) {
        return classFeedService.setPostEmoji(classroomId, postId, request, authentication.getName());
    }

    @DeleteMapping("/{postId}/reactions/emoji")
    public List<FeedEmojiReactionSummary> clearPostEmoji(
            @PathVariable Long classroomId,
            @PathVariable Long postId,
            Authentication authentication) {
        return classFeedService.clearPostEmoji(classroomId, postId, authentication.getName());
    }

    @GetMapping("/{postId}/comments")
    public ClassFeedCommentPageResponse getComments(
            @PathVariable Long classroomId,
            @PathVariable Long postId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int size,
            Authentication authentication) {
        return classFeedService.getComments(classroomId, postId, authentication.getName(), page, size);
    }

    @PostMapping("/{postId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public ClassFeedCommentResponse createComment(
            @PathVariable Long classroomId,
            @PathVariable Long postId,
            @Valid @RequestBody ClassFeedCommentRequest request,
            Authentication authentication) {
        return classFeedService.createComment(classroomId, postId, request, authentication.getName());
    }

    @PutMapping("/{postId}/comments/{commentId}")
    public ClassFeedCommentResponse updateComment(
            @PathVariable Long classroomId,
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @Valid @RequestBody ClassFeedCommentRequest request,
            Authentication authentication) {
        return classFeedService.updateComment(
                classroomId, postId, commentId, request, authentication.getName());
    }

    @DeleteMapping("/{postId}/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(
            @PathVariable Long classroomId,
            @PathVariable Long postId,
            @PathVariable Long commentId,
            Authentication authentication) {
        classFeedService.deleteComment(classroomId, postId, commentId, authentication.getName());
    }

    @PutMapping("/{postId}/comments/{commentId}/reactions/emoji")
    public List<FeedEmojiReactionSummary> setCommentEmoji(
            @PathVariable Long classroomId,
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @Valid @RequestBody FeedEmojiReactionRequest request,
            Authentication authentication) {
        return classFeedService.setCommentEmoji(
                classroomId, postId, commentId, request, authentication.getName());
    }

    @DeleteMapping("/{postId}/comments/{commentId}/reactions/emoji")
    public List<FeedEmojiReactionSummary> clearCommentEmoji(
            @PathVariable Long classroomId,
            @PathVariable Long postId,
            @PathVariable Long commentId,
            Authentication authentication) {
        return classFeedService.clearCommentEmoji(
                classroomId, postId, commentId, authentication.getName());
    }
}
