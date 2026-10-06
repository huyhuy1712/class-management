package com.classmanagement.backend.repository.projection;

import com.classmanagement.backend.entity.enums.ClassroomStatus;

import java.time.LocalDateTime;

public interface ClassroomSummaryProjection {

    Long getId();

    String getName();

    String getCode();

    Long getSubjectId();

    String getSubjectName();

    Long getTeacherId();

    String getTeacherName();

    String getAcademicYear();

    String getDescription();

    ClassroomStatus getStatus();

    LocalDateTime getCreatedAt();

    LocalDateTime getUpdatedAt();
}
