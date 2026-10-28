package com.classmanagement.backend.service.feed.impl;

import com.classmanagement.backend.dto.feed.ClassFeedPostPageResponse;
import com.classmanagement.backend.dto.feed.ClassFeedPostRequest;
import com.classmanagement.backend.dto.feed.ClassFeedPostResponse;
import com.classmanagement.backend.entity.ClassFeedPost;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.classroom.ClassroomRepository;
import com.classmanagement.backend.repository.feed.ClassFeedPostRepository;
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

@Service
@RequiredArgsConstructor
public class ClassFeedServiceImpl implements ClassFeedService {

    private static final int MAX_PAGE_SIZE = 50;

    private final ClassFeedPostRepository postRepository;
    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    @Override
    @Transactional(readOnly = true)
    public ClassFeedPostPageResponse getPosts(Long classroomId, String username, int page, int size) {
        requireFeedAccess(classroomId, username);
        validatePageSize(size);

        Page<ClassFeedPostResponse> result = postRepository.findFeedByClassroomId(
                classroomId,
                PageRequest.of(page, size, Sort.by(
                        Sort.Order.desc("createdAt"),
                        Sort.Order.desc("id"))));

        Page<ClassFeedPostResponse> responsePage = result.map(this::resolveAuthorAvatar);
        return new ClassFeedPostPageResponse(
                responsePage.getContent(),
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
        return toResponse(savedPost);
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
        return toResponse(postRepository.saveAndFlush(post));
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

    private ClassFeedPostResponse toResponse(ClassFeedPost post) {
        User author = post.getAuthor();
        return new ClassFeedPostResponse(
                post.getId(),
                post.getClassroom().getId(),
                author.getId(),
                displayName(author),
                storageService.getUrl(author.getAvatar()),
                author.getRole(),
                post.getContent(),
                post.getCreatedAt(),
                post.getUpdatedAt());
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
                post.updatedAt());
    }

    private String displayName(User author) {
        String fullName = author.getFullName();
        return fullName == null || fullName.isBlank() ? author.getUsername() : fullName;
    }
}
