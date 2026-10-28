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
                        post.updatedAt,
                        count(comment.id),
                        (select count(likeReaction)
                         from ClassFeedPostReaction likeReaction
                         where likeReaction.post.id = post.id
                           and likeReaction.id.reactionKind = com.classmanagement.backend.entity.enums.FeedReactionKind.VOTE
                           and likeReaction.reactionCode = 'LIKE'),
                        (select count(dislikeReaction)
                         from ClassFeedPostReaction dislikeReaction
                         where dislikeReaction.post.id = post.id
                           and dislikeReaction.id.reactionKind = com.classmanagement.backend.entity.enums.FeedReactionKind.VOTE
                           and dislikeReaction.reactionCode = 'DISLIKE'),
                        (select myReaction.reactionCode
                         from ClassFeedPostReaction myReaction
                         where myReaction.post.id = post.id
                           and myReaction.user.username = :username
                           and myReaction.id.reactionKind = com.classmanagement.backend.entity.enums.FeedReactionKind.VOTE)
                    )
                    from ClassFeedPost post
                    join post.author author
                    left join ClassFeedComment comment
                      on comment.post.id = post.id
                     and comment.deletedAt is null
                    where post.classroom.id = :classroomId
                      and post.deletedAt is null
                    group by post.id, post.classroom.id, author.id, author.fullName, author.username,
                             author.avatar, author.role, post.content, post.createdAt, post.updatedAt
                    """,
            countQuery = """
                    select count(post)
                    from ClassFeedPost post
                    where post.classroom.id = :classroomId
                      and post.deletedAt is null
                    """)
    Page<ClassFeedPostResponse> findFeedByClassroomId(
            @Param("classroomId") Long classroomId,
            @Param("username") String username,
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
