package com.classmanagement.backend.dto.attendance;

import com.classmanagement.backend.entity.enums.AttendanceStatus;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AttendanceStudentRequest {

    @NotNull(message = "ID học sinh không được để trống")
    private Long studentId;

    @NotNull(message = "Trạng thái điểm danh không được để trống")
    private AttendanceStatus status;

    private String note;
}