package com.classmanagement.backend.service.mapper;

import com.classmanagement.backend.dto.classroom.ClassroomResponse;
import com.classmanagement.backend.repository.projection.ClassroomSummaryProjection;

public final class ClassroomResponseMapper {
    private ClassroomResponseMapper() {}

    public static ClassroomResponse fromSummary(ClassroomSummaryProjection classroom) {
        return ClassroomResponse.builder()
                .id(classroom.getId()).name(classroom.getName()).code(classroom.getCode())
                .subjectId(classroom.getSubjectId()).subjectName(classroom.getSubjectName())
                .teacherId(classroom.getTeacherId()).teacherName(classroom.getTeacherName())
                .academicYear(classroom.getAcademicYear()).description(classroom.getDescription())
                .status(classroom.getStatus()).createdAt(classroom.getCreatedAt())
                .updatedAt(classroom.getUpdatedAt()).build();
    }
}
