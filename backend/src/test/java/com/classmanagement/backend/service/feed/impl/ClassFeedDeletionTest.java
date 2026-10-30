package com.classmanagement.backend.service.feed.impl;

import com.classmanagement.backend.dto.feed.ClassFeedCommentRequest;
import com.classmanagement.backend.dto.feed.ClassFeedPostVoteRequest;
import com.classmanagement.backend.dto.feed.ClassFeedPostVoteResponse;
import com.classmanagement.backend.dto.feed.FeedEmojiReactionRequest;
import com.classmanagement.backend.dto.feed.FeedEmojiReactionSummary;
import com.classmanagement.backend.entity.ClassFeedComment;
import com.classmanagement.backend.entity.ClassFeedPost;
import com.classmanagement.backend.entity.ClassFeedPostReaction;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.classroom.ClassroomRepository;
import com.classmanagement.backend.repository.feed.ClassFeedCommentRepository;
import com.classmanagement.backend.repository.feed.ClassFeedCommentReactionRepository;
import com.classmanagement.backend.repository.feed.ClassFeedPostRepository;
import com.classmanagement.backend.repository.feed.ClassFeedPostReactionRepository;
import com.classmanagement.backend.service.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class ClassFeedDeletionTest {

    private final ClassFeedPostRepository postRepository = mock(ClassFeedPostRepository.class);
    private final ClassFeedCommentRepository commentRepository = mock(ClassFeedCommentRepository.class);
    private final ClassFeedPostReactionRepository postReactionRepository = mock(ClassFeedPostReactionRepository.class);
    private final ClassFeedCommentReactionRepository commentReactionRepository = mock(ClassFeedCommentReactionRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final ClassFeedServiceImpl service = new ClassFeedServiceImpl(
            postRepository,
            mock(ClassroomRepository.class),
            userRepository,
            mock(StorageService.class),
            commentRepository,
            postReactionRepository,
            commentReactionRepository);

    @BeforeEach
    void allowClassroomAccess() {
        when(postRepository.isFeedAccessible(21L, "owner")).thenReturn(Optional.of(true));
        when(postRepository.isFeedAccessible(21L, "other")).thenReturn(Optional.of(true));
    }

    @Test
    void postAuthorCanSoftDeleteTheirPost() {
        ClassFeedPost post = ClassFeedPost.builder()
                .id(12L)
                .author(User.builder().username("owner").build())
                .build();
        when(postRepository.findActivePostWithAuthor(12L, 21L)).thenReturn(Optional.of(post));

        service.deletePost(21L, 12L, "owner");

        assertNotNull(post.getDeletedAt());
        verify(postRepository).save(post);
    }

    @Test
    void anotherClassMemberCannotDeleteThePost() {
        ClassFeedPost post = ClassFeedPost.builder()
                .id(12L)
                .author(User.builder().username("owner").build())
                .build();
        when(postRepository.findActivePostWithAuthor(12L, 21L)).thenReturn(Optional.of(post));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.deletePost(21L, 12L, "other"));

        assertEquals(403, error.getStatusCode().value());
        verify(postRepository, never()).save(any(ClassFeedPost.class));
    }

    @Test
    void commentAuthorCanSoftDeleteTheirComment() {
        ClassFeedPost post = ClassFeedPost.builder()
                .id(12L)
                .author(User.builder().username("owner").build())
                .build();
        ClassFeedComment comment = ClassFeedComment.builder()
                .id(31L)
                .post(post)
                .author(User.builder().username("owner").build())
                .build();
        when(postRepository.findActivePostWithAuthor(12L, 21L)).thenReturn(Optional.of(post));
        when(commentRepository.findActiveCommentWithAuthor(31L, 12L)).thenReturn(Optional.of(comment));

        service.deleteComment(21L, 12L, 31L, "owner");

        assertNotNull(comment.getDeletedAt());
        verify(commentRepository).save(comment);
    }

    @Test
    void anotherClassMemberCannotDeleteTheComment() {
        ClassFeedPost post = ClassFeedPost.builder()
                .id(12L)
                .author(User.builder().username("owner").build())
                .build();
        ClassFeedComment comment = ClassFeedComment.builder()
                .id(31L)
                .post(post)
                .author(User.builder().username("owner").build())
                .build();
        when(postRepository.findActivePostWithAuthor(12L, 21L)).thenReturn(Optional.of(post));
        when(commentRepository.findActiveCommentWithAuthor(31L, 12L)).thenReturn(Optional.of(comment));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.deleteComment(21L, 12L, 31L, "other"));

        assertEquals(403, error.getStatusCode().value());
        verify(commentRepository, never()).save(any(ClassFeedComment.class));
    }

    @Test
    void commentAuthorCanUpdateTheirComment() {
        ClassFeedPost post = ClassFeedPost.builder()
                .id(12L)
                .author(User.builder().username("owner").build())
                .build();
        ClassFeedComment comment = ClassFeedComment.builder()
                .id(31L)
                .post(post)
                .author(User.builder().id(5L).username("owner").fullName("Owner").build())
                .content("old")
                .build();
        when(postRepository.findActivePostWithAuthor(12L, 21L)).thenReturn(Optional.of(post));
        when(commentRepository.findActiveCommentWithAuthor(31L, 12L)).thenReturn(Optional.of(comment));
        when(commentRepository.saveAndFlush(comment)).thenReturn(comment);

        var response = service.updateComment(21L, 12L, 31L, new ClassFeedCommentRequest(" updated "), "owner");

        assertEquals("updated", comment.getContent());
        assertEquals("updated", response.content());
        verify(commentRepository).saveAndFlush(comment);
    }

    @Test
    void anotherClassMemberCannotUpdateTheComment() {
        ClassFeedPost post = ClassFeedPost.builder()
                .id(12L)
                .author(User.builder().username("owner").build())
                .build();
        ClassFeedComment comment = ClassFeedComment.builder()
                .id(31L)
                .post(post)
                .author(User.builder().username("owner").build())
                .content("unchanged")
                .build();
        when(postRepository.findActivePostWithAuthor(12L, 21L)).thenReturn(Optional.of(post));
        when(commentRepository.findActiveCommentWithAuthor(31L, 12L)).thenReturn(Optional.of(comment));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.updateComment(21L, 12L, 31L, new ClassFeedCommentRequest("changed"), "other"));

        assertEquals(403, error.getStatusCode().value());
        assertEquals("unchanged", comment.getContent());
        verify(commentRepository, never()).saveAndFlush(any(ClassFeedComment.class));
    }

    @Test
    void classMemberCanSetTheirPostVote() {
        User user = User.builder().id(8L).username("owner").build();
        ClassFeedPost post = ClassFeedPost.builder().id(12L).build();
        ClassFeedPostVoteResponse summary = new ClassFeedPostVoteResponse(4, 1, "LIKE");
        when(postRepository.findActivePostWithAuthor(12L, 21L)).thenReturn(Optional.of(post));
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(user));
        when(postRepository.getReferenceById(12L)).thenReturn(post);
        when(postReactionRepository.findVoteSummary(12L, 8L)).thenReturn(Optional.of(summary));

        ClassFeedPostVoteResponse response = service.setPostVote(
                21L, 12L, new ClassFeedPostVoteRequest("LIKE"), "owner");

        assertEquals("LIKE", response.myVote());
        verify(postReactionRepository).save(argThat(reaction ->
                reaction.getReactionCode().equals("LIKE")
                        && reaction.getId().getUserId().equals(8L)));
    }

    @Test
    void memberCannotVoteOnPostOutsideTheirClass() {
        when(postRepository.isFeedAccessible(21L, "other")).thenReturn(Optional.of(false));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.setPostVote(21L, 12L, new ClassFeedPostVoteRequest("LIKE"), "other"));

        assertEquals(403, error.getStatusCode().value());
        verify(postReactionRepository, never()).save(any(ClassFeedPostReaction.class));
    }

    @Test
    void classMemberCanReactToPostWithEmoji() {
        User user = User.builder().id(8L).username("owner").build();
        ClassFeedPost post = ClassFeedPost.builder().id(12L).build();
        when(postRepository.findActivePostWithAuthor(12L, 21L)).thenReturn(Optional.of(post));
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(user));
        when(postRepository.getReferenceById(12L)).thenReturn(post);
        when(postReactionRepository.findEmojiSummaries(
                eq(java.util.List.of(12L)), eq("owner"), eq(com.classmanagement.backend.entity.enums.FeedReactionKind.EMOJI)))
                .thenReturn(java.util.List.of(new com.classmanagement.backend.dto.feed.FeedEmojiReactionRow(12L, "1f602", 1, 1)));

        var response = service.setPostEmoji(21L, 12L, new FeedEmojiReactionRequest("1f602"), "owner");

        assertEquals(java.util.List.of(new FeedEmojiReactionSummary("1f602", 1, true)), response);
        verify(postReactionRepository).saveAndFlush(argThat(reaction ->
                reaction.getReactionCode().equals("1f602")
                        && reaction.getId().getUserId().equals(8L)));
    }

    @Test
    void classMemberCanRemoveEmojiFromTheirComment() {
        User user = User.builder().id(8L).username("owner").build();
        ClassFeedPost post = ClassFeedPost.builder().id(12L).build();
        ClassFeedComment comment = ClassFeedComment.builder()
                .id(31L)
                .post(post)
                .author(User.builder().username("owner").build())
                .build();
        when(postRepository.findActivePostWithAuthor(12L, 21L)).thenReturn(Optional.of(post));
        when(commentRepository.findActiveCommentWithAuthor(31L, 12L)).thenReturn(Optional.of(comment));
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(user));
        when(commentReactionRepository.findEmojiSummaries(
                eq(java.util.List.of(31L)), eq("owner"), eq(com.classmanagement.backend.entity.enums.FeedReactionKind.EMOJI)))
                .thenReturn(java.util.List.of());

        var response = service.clearCommentEmoji(21L, 12L, 31L, "owner");

        assertEquals(java.util.List.of(), response);
        verify(commentReactionRepository).deleteById(argThat(id ->
                id.getCommentId().equals(31L) && id.getUserId().equals(8L)));
    }
}
