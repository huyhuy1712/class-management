package com.classmanagement.backend.dto.lesson;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class LessonResponse {

    private Long id;

    private Long classroomId;

    private String classroomName;

    private String title;

    private LocalDate lessonDate;

    private String attendanceCode;

    private LocalDateTime startTime;

    private LocalDateTime lateTime;

    private LocalDateTime endTime;

    private LocalDateTime createdAt;
}