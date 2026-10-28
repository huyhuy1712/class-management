package com.classmanagement.backend.repository.feed;

import com.classmanagement.backend.dto.feed.ClassFeedPostResponse;
import com.classmanagement.backend.entity.ClassFeedPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ClassFeedPostRepository extends JpaRepository<ClassFeedPost, Long> {

    @Query("""
            select case when (
                c.teacher.username = :username
                or exists (
                    select cs.id
                    from ClassStudent cs
                    where cs.classroom.id = c.id
                      and cs.student.username = :username
                )
            ) then true else false end
            from Classroom c
            where c.id = :classroomId
            """)
    Optional<Boolean> isFeedAccessible(
            @Param("classroomId") Long classroomId,
            @Param("username") String username);

    @Query(
            value = """
                    select new com.classmanagement.backend.dto.feed.ClassFeedPostResponse(
                        post.id,
                        post.classroom.id,
                        author.id,
                        coalesce(nullif(author.fullName, ''), author.username),
                        author.avatar,
                        author.role,
                        post.content,
                        post.createdAt,
                        post.updatedAt
                    )
                    from ClassFeedPost post
                    join post.author author
                    where post.classroom.id = :classroomId
                      and post.deletedAt is null
                    """,
            countQuery = """
                    select count(post)
                    from ClassFeedPost post
                    where post.classroom.id = :classroomId
                      and post.deletedAt is null
                    """)
    Page<ClassFeedPostResponse> findFeedByClassroomId(
            @Param("classroomId") Long classroomId,
            Pageable pageable);

    @Query("""
            select post
            from ClassFeedPost post
            join fetch post.author
            where post.id = :postId
              and post.classroom.id = :classroomId
              and post.deletedAt is null
            """)
    Optional<ClassFeedPost> findActivePostWithAuthor(
            @Param("postId") Long postId,
            @Param("classroomId") Long classroomId);
}
