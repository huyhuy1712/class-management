package com.classmanagement.backend.repository.feed;

import com.classmanagement.backend.dto.feed.FeedEmojiReactionRow;
import com.classmanagement.backend.dto.feed.ClassFeedPostVoteResponse;
import com.classmanagement.backend.entity.ClassFeedPostReaction;
import com.classmanagement.backend.entity.compositeID.ClassFeedPostReactionId;
import com.classmanagement.backend.entity.enums.FeedReactionKind;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.Collection;
import java.util.List;

public interface ClassFeedPostReactionRepository
        extends JpaRepository<ClassFeedPostReaction, ClassFeedPostReactionId> {

    @Query("""
            select new com.classmanagement.backend.dto.feed.FeedEmojiReactionRow(
                reaction.post.id,
                reaction.reactionCode,
                count(reaction),
                sum(case when reaction.user.username = :username then 1 else 0 end)
            )
            from ClassFeedPostReaction reaction
            where reaction.post.id in :postIds
              and reaction.id.reactionKind = :reactionKind
            group by reaction.post.id, reaction.reactionCode
            """)
    List<FeedEmojiReactionRow> findEmojiSummaries(
            @Param("postIds") Collection<Long> postIds,
            @Param("username") String username,
            @Param("reactionKind") FeedReactionKind reactionKind);

    @Query("""
            select new com.classmanagement.backend.dto.feed.ClassFeedPostVoteResponse(
                (select count(likeReaction)
                 from ClassFeedPostReaction likeReaction
                 where likeReaction.post.id = :postId
                   and likeReaction.id.reactionKind = com.classmanagement.backend.entity.enums.FeedReactionKind.VOTE
                   and likeReaction.reactionCode = 'LIKE'),
                (select count(dislikeReaction)
                 from ClassFeedPostReaction dislikeReaction
                 where dislikeReaction.post.id = :postId
                   and dislikeReaction.id.reactionKind = com.classmanagement.backend.entity.enums.FeedReactionKind.VOTE
                   and dislikeReaction.reactionCode = 'DISLIKE'),
                (select myReaction.reactionCode
                 from ClassFeedPostReaction myReaction
                 where myReaction.post.id = :postId
                   and myReaction.user.id = :userId
                   and myReaction.id.reactionKind = com.classmanagement.backend.entity.enums.FeedReactionKind.VOTE)
            )
            from ClassFeedPost post
            where post.id = :postId
            """)
    Optional<ClassFeedPostVoteResponse> findVoteSummary(
            @Param("postId") Long postId,
            @Param("userId") Long userId);
}
