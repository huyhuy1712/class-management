package com.classmanagement.backend.repository.feed;

import com.classmanagement.backend.dto.feed.ClassFeedCommentResponse;
import com.classmanagement.backend.entity.ClassFeedComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ClassFeedCommentRepository extends JpaRepository<ClassFeedComment, Long> {

    @Query(
            value = """
                    select new com.classmanagement.backend.dto.feed.ClassFeedCommentResponse(
                        comment.id,
                        comment.post.id,
                        parent.id,
                        author.id,
                        coalesce(nullif(author.fullName, ''), author.username),
                        author.avatar,
                        author.role,
                        comment.content,
                        comment.createdAt,
                        comment.updatedAt
                    )
                    from ClassFeedComment comment
                    join comment.author author
                    left join comment.parentComment parent
                    where comment.post.id = :postId
                      and comment.deletedAt is null
                    """,
            countQuery = """
                    select count(comment)
                    from ClassFeedComment comment
                    where comment.post.id = :postId
                      and comment.deletedAt is null
                    """)
    Page<ClassFeedCommentResponse> findActiveCommentsByPostId(
            @Param("postId") Long postId,
            Pageable pageable);

    @Query("""
            select comment
            from ClassFeedComment comment
            join fetch comment.author
            where comment.id = :commentId
              and comment.post.id = :postId
              and comment.deletedAt is null
            """)
    Optional<ClassFeedComment> findActiveCommentWithAuthor(
            @Param("commentId") Long commentId,
            @Param("postId") Long postId);

    long countByPost_IdAndDeletedAtIsNull(Long postId);
}
