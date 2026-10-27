package com.classmanagement.backend.service.feed;

import com.classmanagement.backend.dto.feed.ClassFeedPostPageResponse;
import com.classmanagement.backend.dto.feed.ClassFeedPostRequest;
import com.classmanagement.backend.dto.feed.ClassFeedPostResponse;

public interface ClassFeedService {

    ClassFeedPostPageResponse getPosts(Long classroomId, String username, int page, int size);

    ClassFeedPostResponse createPost(Long classroomId, ClassFeedPostRequest request, String username);

    ClassFeedPostResponse updatePost(
            Long classroomId,
            Long postId,
            ClassFeedPostRequest request,
            String username);
}
