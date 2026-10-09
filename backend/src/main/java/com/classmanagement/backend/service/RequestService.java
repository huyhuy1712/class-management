package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.request.JoinClassRequestResponse;

import java.util.List;

public interface RequestService {

    void createJoinClassRequest(Long classroomId, String username, String message);

    List<JoinClassRequestResponse> getPendingJoinClassRequests(String username);

    void rejectJoinClassRequest(Long requestId, String username);

    void approveJoinClassRequest(Long requestId, String username);
}