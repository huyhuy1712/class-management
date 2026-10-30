package com.classmanagement.backend.repository.feed;

import com.classmanagement.backend.dto.feed.FeedEmojiReactionRow;
import com.classmanagement.backend.entity.ClassFeedCommentReaction;
import com.classmanagement.backend.entity.compositeID.ClassFeedCommentReactionId;
import com.classmanagement.backend.entity.enums.FeedReactionKind;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ClassFeedCommentReactionRepository
        extends JpaRepository<ClassFeedCommentReaction, ClassFeedCommentReactionId> {

    @Query("""
            select new com.classmanagement.backend.dto.feed.FeedEmojiReactionRow(
                reaction.comment.id,
                reaction.reactionCode,
                count(reaction),
                sum(case when reaction.user.username = :username then 1 else 0 end)
            )
            from ClassFeedCommentReaction reaction
            where reaction.comment.id in :commentIds
              and reaction.id.reactionKind = :reactionKind
            group by reaction.comment.id, reaction.reactionCode
            """)
    List<FeedEmojiReactionRow> findEmojiSummaries(
            @Param("commentIds") Collection<Long> commentIds,
            @Param("username") String username,
            @Param("reactionKind") FeedReactionKind reactionKind);
}
