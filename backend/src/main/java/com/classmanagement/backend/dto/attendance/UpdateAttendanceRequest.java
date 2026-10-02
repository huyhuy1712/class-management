package com.classmanagement.backend.dto.attendance;

import java.time.LocalDate;

import com.classmanagement.backend.entity.enums.AttendanceStatus;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateAttendanceRequest {

    private LocalDate date;

    private AttendanceStatus status;

    private String note;
}