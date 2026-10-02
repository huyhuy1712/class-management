package com.classmanagement.backend.dto.request;

import com.classmanagement.backend.entity.enums.RequestStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class JoinClassRequestResponse {

    private Long requestId;

    private Long studentId;
    private String studentCode;
    private String fullName;
    private String avatar;
    private String username;

    private Long classroomId;
    private String classroomName;
    private String classroomCode;

    private String message;

    private RequestStatus status;

    private LocalDateTime createdAt;
}