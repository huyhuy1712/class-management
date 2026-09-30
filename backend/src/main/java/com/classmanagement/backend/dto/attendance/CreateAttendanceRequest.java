package com.classmanagement.backend.dto.attendance;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateAttendanceRequest {

    @NotNull(message = "Ngày điểm danh không được để trống")
    private LocalDate date;

    @Valid
    @NotEmpty(message = "Danh sách điểm danh không được để trống")
    private List<AttendanceStudentRequest> students;
}