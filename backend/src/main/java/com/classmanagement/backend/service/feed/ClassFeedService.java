package com.classmanagement.backend.service.feed;

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

import java.util.List;

public interface ClassFeedService {

    ClassFeedPostPageResponse getPosts(Long classroomId, String username, int page, int size);

    ClassFeedPostResponse createPost(Long classroomId, ClassFeedPostRequest request, String username);

    ClassFeedPostResponse updatePost(
            Long classroomId,
            Long postId,
            ClassFeedPostRequest request,
            String username);

    void deletePost(Long classroomId, Long postId, String username);

    ClassFeedPostVoteResponse setPostVote(
            Long classroomId,
            Long postId,
            ClassFeedPostVoteRequest request,
            String username);

    ClassFeedPostVoteResponse clearPostVote(Long classroomId, Long postId, String username);

    List<FeedEmojiReactionSummary> setPostEmoji(
            Long classroomId, Long postId, FeedEmojiReactionRequest request, String username);

    List<FeedEmojiReactionSummary> clearPostEmoji(Long classroomId, Long postId, String username);

    ClassFeedCommentPageResponse getComments(
            Long classroomId,
            Long postId,
            String username,
            int page,
            int size);

    ClassFeedCommentResponse createComment(
            Long classroomId,
            Long postId,
            ClassFeedCommentRequest request,
            String username);

    ClassFeedCommentResponse updateComment(
            Long classroomId,
            Long postId,
            Long commentId,
            ClassFeedCommentRequest request,
            String username);

    void deleteComment(Long classroomId, Long postId, Long commentId, String username);

    List<FeedEmojiReactionSummary> setCommentEmoji(
            Long classroomId, Long postId, Long commentId, FeedEmojiReactionRequest request, String username);

    List<FeedEmojiReactionSummary> clearCommentEmoji(
            Long classroomId, Long postId, Long commentId, String username);
}
