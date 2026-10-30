package com.classmanagement.backend.dto.feed;

public record ClassFeedPostVoteResponse(
        long likeCount,
        long dislikeCount,
        String myVote) {
}
