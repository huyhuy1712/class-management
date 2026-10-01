package com.classmanagement.backend.dto.attendance;

import java.time.LocalDate;

import com.classmanagement.backend.entity.enums.AttendanceStatus;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AttendanceResponse {

    private Long id;

    private Long studentId;

    private String studentCode;

    private String studentAvatar;

    private String fullName;

    private LocalDate date;

    private AttendanceStatus status;

    private String note;
}