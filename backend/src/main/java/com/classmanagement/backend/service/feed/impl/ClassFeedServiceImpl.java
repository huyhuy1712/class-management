package com.classmanagement.backend.service.feed.impl;

import com.classmanagement.backend.dto.feed.ClassFeedCommentPageResponse;
import com.classmanagement.backend.dto.feed.ClassFeedCommentRequest;
import com.classmanagement.backend.dto.feed.ClassFeedCommentResponse;
import com.classmanagement.backend.dto.feed.ClassFeedPostPageResponse;
import com.classmanagement.backend.dto.feed.ClassFeedPostRequest;
import com.classmanagement.backend.dto.feed.ClassFeedPostResponse;
import com.classmanagement.backend.dto.feed.ClassFeedPostVoteRequest;
import com.classmanagement.backend.dto.feed.ClassFeedPostVoteResponse;
import com.classmanagement.backend.dto.feed.FeedEmojiReactionRequest;
import com.classmanagement.backend.dto.feed.FeedEmojiReactionRow;
import com.classmanagement.backend.dto.feed.FeedEmojiReactionSummary;
import com.classmanagement.backend.entity.ClassFeedComment;
import com.classmanagement.backend.entity.ClassFeedCommentReaction;
import com.classmanagement.backend.entity.ClassFeedPost;
import com.classmanagement.backend.entity.ClassFeedPostReaction;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.compositeID.ClassFeedCommentReactionId;
import com.classmanagement.backend.entity.compositeID.ClassFeedPostReactionId;
import com.classmanagement.backend.entity.enums.FeedReactionKind;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.classroom.ClassroomRepository;
import com.classmanagement.backend.repository.feed.ClassFeedCommentRepository;
import com.classmanagement.backend.repository.feed.ClassFeedCommentReactionRepository;
import com.classmanagement.backend.repository.feed.ClassFeedPostRepository;
import com.classmanagement.backend.repository.feed.ClassFeedPostReactionRepository;
import com.classmanagement.backend.service.StorageService;
import com.classmanagement.backend.service.feed.ClassFeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClassFeedServiceImpl implements ClassFeedService {

    private static final int MAX_PAGE_SIZE = 50;
    private static final int MAX_COMMENT_PAGE_SIZE = 50;

    private final ClassFeedPostRepository postRepository;
    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final ClassFeedCommentRepository commentRepository;
    private final ClassFeedPostReactionRepository postReactionRepository;
    private final ClassFeedCommentReactionRepository commentReactionRepository;

    @Override
    @Transactional(readOnly = true)
    public ClassFeedPostPageResponse getPosts(Long classroomId, String username, int page, int size) {
        requireFeedAccess(classroomId, username);
        validatePageSize(size);

        Page<ClassFeedPostResponse> result = postRepository.findFeedByClassroomId(
                classroomId,
                username,
                PageRequest.of(page, size, Sort.by(
                        Sort.Order.desc("createdAt"),
                        Sort.Order.desc("id"))));

        Page<ClassFeedPostResponse> responsePage = result.map(this::resolveAuthorAvatar);
        List<Long> postIds = responsePage.getContent().stream().map(ClassFeedPostResponse::id).toList();
        Map<Long, List<FeedEmojiReactionSummary>> emojiReactions = postIds.isEmpty()
                ? Map.of()
                : groupEmojiReactions(postReactionRepository.findEmojiSummaries(
                        postIds, username, FeedReactionKind.EMOJI));
        return new ClassFeedPostPageResponse(
                responsePage.getContent().stream()
                        .map(post -> withPostEmojiReactions(
                                post, emojiReactions.getOrDefault(post.id(), List.of())))
                        .toList(),
                responsePage.getNumber(),
                responsePage.getSize(),
                responsePage.getTotalElements(),
                responsePage.getTotalPages());
    }

    @Override
    @Transactional
    public ClassFeedPostResponse createPost(
            Long classroomId,
            ClassFeedPostRequest request,
            String username) {
        requireFeedAccess(classroomId, username);
        User author = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        ClassFeedPost post = ClassFeedPost.builder()
                .classroom(classroomRepository.getReferenceById(classroomId))
                .author(author)
                .content(request.content().trim())
                .build();

        ClassFeedPost savedPost = postRepository.saveAndFlush(post);
        return toResponse(savedPost, username);
    }

    @Override
    @Transactional
    public ClassFeedPostResponse updatePost(
            Long classroomId,
            Long postId,
            ClassFeedPostRequest request,
            String username) {
        requireFeedAccess(classroomId, username);

        ClassFeedPost post = postRepository.findActivePostWithAuthor(postId, classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài đăng"));
        if (!post.getAuthor().getUsername().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không thể sửa bài đăng của người khác");
        }

        post.setContent(request.content().trim());
        return toResponse(postRepository.saveAndFlush(post), username);
    }

    @Override
    @Transactional
    public void deletePost(Long classroomId, Long postId, String username) {
        requireFeedAccess(classroomId, username);
        ClassFeedPost post = requireActivePost(classroomId, postId);
        if (!post.getAuthor().getUsername().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không thể xóa bài đăng của người khác");
        }
        post.setDeletedAt(LocalDateTime.now());
        postRepository.save(post);
    }

    @Override
    @Transactional
    public ClassFeedPostVoteResponse setPostVote(
            Long classroomId,
            Long postId,
            ClassFeedPostVoteRequest request,
            String username) {
        requireFeedAccess(classroomId, username);
        requireActivePost(classroomId, postId);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        ClassFeedPostReactionId reactionId = new ClassFeedPostReactionId(
                postId, user.getId(), FeedReactionKind.VOTE);
        ClassFeedPostReaction reaction = postReactionRepository.findById(reactionId).orElse(null);

        if (reaction != null) {
            reaction.setReactionCode(request.vote());
            postReactionRepository.save(reaction);
        } else {
            postReactionRepository.save(ClassFeedPostReaction.builder()
                    .id(reactionId)
                    .post(postRepository.getReferenceById(postId))
                    .user(user)
                    .reactionCode(request.vote())
                    .build());
        }

        return getVoteSummary(postId, user.getId());
    }

    @Override
    @Transactional
    public ClassFeedPostVoteResponse clearPostVote(Long classroomId, Long postId, String username) {
        requireFeedAccess(classroomId, username);
        requireActivePost(classroomId, postId);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        postReactionRepository.deleteById(new ClassFeedPostReactionId(
                postId, user.getId(), FeedReactionKind.VOTE));
        return getVoteSummary(postId, user.getId());
    }

    @Override
    @Transactional
    public List<FeedEmojiReactionSummary> setPostEmoji(
            Long classroomId,
            Long postId,
            FeedEmojiReactionRequest request,
            String username) {
        requireFeedAccess(classroomId, username);
        requireActivePost(classroomId, postId);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        ClassFeedPostReactionId reactionId = new ClassFeedPostReactionId(
                postId, user.getId(), FeedReactionKind.EMOJI);
        ClassFeedPostReaction reaction = postReactionRepository.findById(reactionId).orElse(null);
        if (reaction == null) {
            reaction = ClassFeedPostReaction.builder()
                    .id(reactionId)
                    .post(postRepository.getReferenceById(postId))
                    .user(user)
                    .reactionCode(request.emojiCode())
                    .build();
        } else {
            reaction.setReactionCode(request.emojiCode());
        }
        postReactionRepository.saveAndFlush(reaction);
        return getPostEmojiReactions(postId, username);
    }

    @Override
    @Transactional
    public List<FeedEmojiReactionSummary> clearPostEmoji(Long classroomId, Long postId, String username) {
        requireFeedAccess(classroomId, username);
        requireActivePost(classroomId, postId);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        postReactionRepository.deleteById(new ClassFeedPostReactionId(
                postId, user.getId(), FeedReactionKind.EMOJI));
        return getPostEmojiReactions(postId, username);
    }

    @Override
    @Transactional(readOnly = true)
    public ClassFeedCommentPageResponse getComments(
            Long classroomId,
            Long postId,
            String username,
            int page,
            int size) {
        requireFeedAccess(classroomId, username);
        requireActivePost(classroomId, postId);
        validateCommentPage(page, size);

        Page<ClassFeedCommentResponse> result = commentRepository.findActiveCommentsByPostId(
                postId,
                PageRequest.of(page, size, Sort.by(
                        Sort.Order.desc("createdAt"),
                        Sort.Order.desc("id"))));
        Page<ClassFeedCommentResponse> responsePage = result.map(this::resolveCommentAvatar);
        List<Long> commentIds = responsePage.getContent().stream().map(ClassFeedCommentResponse::id).toList();
        Map<Long, List<FeedEmojiReactionSummary>> emojiReactions = commentIds.isEmpty()
                ? Map.of()
                : groupEmojiReactions(commentReactionRepository.findEmojiSummaries(
                        commentIds, username, FeedReactionKind.EMOJI));
        return new ClassFeedCommentPageResponse(
                responsePage.getContent().stream()
                        .map(comment -> withCommentEmojiReactions(
                                comment, emojiReactions.getOrDefault(comment.id(), List.of())))
                        .toList(),
                responsePage.getNumber(),
                responsePage.getSize(),
                responsePage.getTotalElements(),
                responsePage.getTotalPages());
    }

    @Override
    @Transactional
    public ClassFeedCommentResponse createComment(
            Long classroomId,
            Long postId,
            ClassFeedCommentRequest request,
            String username) {
        requireFeedAccess(classroomId, username);
        requireActivePost(classroomId, postId);
        User author = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        ClassFeedComment comment = ClassFeedComment.builder()
                .post(postRepository.getReferenceById(postId))
                .author(author)
                .content(request.content().trim())
                .build();
        return toCommentResponse(commentRepository.saveAndFlush(comment));
    }

    @Override
    @Transactional
    public ClassFeedCommentResponse updateComment(
            Long classroomId,
            Long postId,
            Long commentId,
            ClassFeedCommentRequest request,
            String username) {
        requireFeedAccess(classroomId, username);
        requireActivePost(classroomId, postId);
        ClassFeedComment comment = commentRepository.findActiveCommentWithAuthor(commentId, postId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bình luận"));
        if (!comment.getAuthor().getUsername().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không thể sửa bình luận của người khác");
        }

        comment.setContent(request.content().trim());
        return toCommentResponse(commentRepository.saveAndFlush(comment));
    }

    @Override
    @Transactional
    public void deleteComment(Long classroomId, Long postId, Long commentId, String username) {
        requireFeedAccess(classroomId, username);
        requireActivePost(classroomId, postId);
        ClassFeedComment comment = commentRepository.findActiveCommentWithAuthor(commentId, postId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bình luận"));
        if (!comment.getAuthor().getUsername().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không thể xóa bình luận của người khác");
        }
        comment.setDeletedAt(LocalDateTime.now());
        commentRepository.save(comment);
    }

    @Override
    @Transactional
    public List<FeedEmojiReactionSummary> setCommentEmoji(
            Long classroomId,
            Long postId,
            Long commentId,
            FeedEmojiReactionRequest request,
            String username) {
        requireFeedAccess(classroomId, username);
        requireActivePost(classroomId, postId);
        requireActiveComment(postId, commentId);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        ClassFeedCommentReactionId reactionId = new ClassFeedCommentReactionId(
                commentId, user.getId(), FeedReactionKind.EMOJI);
        ClassFeedCommentReaction reaction = commentReactionRepository.findById(reactionId).orElse(null);
        if (reaction == null) {
            reaction = ClassFeedCommentReaction.builder()
                    .id(reactionId)
                    .comment(commentRepository.getReferenceById(commentId))
                    .user(user)
                    .reactionCode(request.emojiCode())
                    .build();
        } else {
            reaction.setReactionCode(request.emojiCode());
        }
        commentReactionRepository.saveAndFlush(reaction);
        return getCommentEmojiReactions(commentId, username);
    }

    @Override
    @Transactional
    public List<FeedEmojiReactionSummary> clearCommentEmoji(
            Long classroomId,
            Long postId,
            Long commentId,
            String username) {
        requireFeedAccess(classroomId, username);
        requireActivePost(classroomId, postId);
        requireActiveComment(postId, commentId);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        commentReactionRepository.deleteById(new ClassFeedCommentReactionId(
                commentId, user.getId(), FeedReactionKind.EMOJI));
        return getCommentEmojiReactions(commentId, username);
    }

    private void requireFeedAccess(Long classroomId, String username) {
        Boolean accessible = postRepository.isFeedAccessible(classroomId, username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học"));
        if (!accessible) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập bảng tin lớp học");
        }
    }

    private void validatePageSize(int size) {
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Kích thước trang phải từ 1 đến " + MAX_PAGE_SIZE);
        }
    }

    private void validateCommentPage(int page, int size) {
        if (page < 0 || size < 1 || size > MAX_COMMENT_PAGE_SIZE) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Trang phải từ 0 trở lên và kích thước trang từ 1 đến " + MAX_COMMENT_PAGE_SIZE);
        }
    }

    private ClassFeedPost requireActivePost(Long classroomId, Long postId) {
        return postRepository.findActivePostWithAuthor(postId, classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài đăng"));
    }

    private ClassFeedComment requireActiveComment(Long postId, Long commentId) {
        return commentRepository.findActiveCommentWithAuthor(commentId, postId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bình luận"));
    }

    private List<FeedEmojiReactionSummary> getPostEmojiReactions(Long postId, String username) {
        return groupEmojiReactions(postReactionRepository.findEmojiSummaries(
                List.of(postId), username, FeedReactionKind.EMOJI)).getOrDefault(postId, List.of());
    }

    private List<FeedEmojiReactionSummary> getCommentEmojiReactions(Long commentId, String username) {
        return groupEmojiReactions(commentReactionRepository.findEmojiSummaries(
                List.of(commentId), username, FeedReactionKind.EMOJI)).getOrDefault(commentId, List.of());
    }

    private Map<Long, List<FeedEmojiReactionSummary>> groupEmojiReactions(
            Collection<FeedEmojiReactionRow> rows) {
        return rows.stream().collect(Collectors.groupingBy(
                FeedEmojiReactionRow::targetId,
                Collectors.mapping(row -> new FeedEmojiReactionSummary(
                        row.emojiCode(), row.count(), row.myCount() > 0),
                        Collectors.toList())));
    }

    private ClassFeedPostResponse withPostEmojiReactions(
            ClassFeedPostResponse post,
            List<FeedEmojiReactionSummary> emojiReactions) {
        return new ClassFeedPostResponse(
                post.id(), post.classId(), post.authorId(), post.authorName(), post.authorAvatar(), post.authorRole(),
                post.content(), post.createdAt(), post.updatedAt(), post.commentCount(), post.likeCount(),
                post.dislikeCount(), post.myVote(), emojiReactions);
    }

    private ClassFeedCommentResponse withCommentEmojiReactions(
            ClassFeedCommentResponse comment,
            List<FeedEmojiReactionSummary> emojiReactions) {
        return new ClassFeedCommentResponse(
                comment.id(), comment.postId(), comment.parentCommentId(), comment.authorId(), comment.authorName(),
                comment.authorAvatar(), comment.authorRole(), comment.content(), comment.createdAt(),
                comment.updatedAt(), emojiReactions);
    }

    private ClassFeedPostResponse toResponse(ClassFeedPost post, String username) {
        User author = post.getAuthor();
        ClassFeedPostVoteResponse voteSummary = userRepository.findByUsername(username)
                .map(user -> getVoteSummary(post.getId(), user.getId()))
                .orElse(new ClassFeedPostVoteResponse(0, 0, null));
        return new ClassFeedPostResponse(
                post.getId(),
                post.getClassroom().getId(),
                author.getId(),
                displayName(author),
                storageService.getUrl(author.getAvatar()),
                author.getRole(),
                post.getContent(),
                post.getCreatedAt(),
                post.getUpdatedAt(),
                commentRepository.countByPost_IdAndDeletedAtIsNull(post.getId()),
                voteSummary.likeCount(),
                voteSummary.dislikeCount(),
                voteSummary.myVote());
    }

    private ClassFeedPostResponse resolveAuthorAvatar(ClassFeedPostResponse post) {
        return new ClassFeedPostResponse(
                post.id(),
                post.classId(),
                post.authorId(),
                post.authorName(),
                storageService.getUrl(post.authorAvatar()),
                post.authorRole(),
                post.content(),
                post.createdAt(),
                post.updatedAt(),
                post.commentCount(),
                post.likeCount(),
                post.dislikeCount(),
                post.myVote(),
                post.emojiReactions());
    }

    private ClassFeedPostVoteResponse getVoteSummary(Long postId, Long userId) {
        return postReactionRepository.findVoteSummary(postId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài đăng"));
    }

    private ClassFeedCommentResponse toCommentResponse(ClassFeedComment comment) {
        User author = comment.getAuthor();
        return new ClassFeedCommentResponse(
                comment.getId(),
                comment.getPost().getId(),
                comment.getParentComment() == null ? null : comment.getParentComment().getId(),
                author.getId(),
                displayName(author),
                storageService.getUrl(author.getAvatar()),
                author.getRole(),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getUpdatedAt(),
                List.of());
    }

    private ClassFeedCommentResponse resolveCommentAvatar(ClassFeedCommentResponse comment) {
        return new ClassFeedCommentResponse(
                comment.id(),
                comment.postId(),
                comment.parentCommentId(),
                comment.authorId(),
                comment.authorName(),
                storageService.getUrl(comment.authorAvatar()),
                comment.authorRole(),
                comment.content(),
                comment.createdAt(),
                comment.updatedAt(),
                comment.emojiReactions());
    }

    private String displayName(User author) {
        String fullName = author.getFullName();
        return fullName == null || fullName.isBlank() ? author.getUsername() : fullName;
    }
}
