package com.classmanagement.backend.dto.attendance;

import com.classmanagement.backend.entity.enums.AttendanceStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class StudentAttendanceResponse {

    private Long id;
    private Long classroomId;
    private String classroomName;
    private String classroomCode;
    private LocalDate date;
    private AttendanceStatus status;
    private String note;
}