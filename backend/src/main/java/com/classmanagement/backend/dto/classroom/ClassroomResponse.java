package com.classmanagement.backend.dto.classroom;

import com.classmanagement.backend.entity.enums.ClassroomStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ClassroomResponse {

    private Long id;

    private String name;
    private String code;

    private Long subjectId;
    private String subjectName;

    private Long teacherId;
    private String teacherName;

    private String academicYear;
    private String description;

    private ClassroomStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}