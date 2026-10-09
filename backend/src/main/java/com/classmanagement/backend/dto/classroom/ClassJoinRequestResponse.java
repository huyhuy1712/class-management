package com.classmanagement.backend.dto.classroom;

import com.classmanagement.backend.entity.enums.ClassJoinRequestStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ClassJoinRequestResponse {

    private Long id;
    private Long classroomId;
    private String classroomName;
    private Long studentId;
    private ClassJoinRequestStatus status;
    private String message;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}