package com.classmanagement.backend.dto.lesson;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class CreateLessonRequest {

    @NotBlank(message = "Tên buổi học không được để trống")
    private String title;

    @NotNull(message = "Ngày học không được để trống")
    private LocalDate lessonDate;

    @NotBlank(message = "Mã điểm danh không được để trống")
    private String attendanceCode;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    private LocalDateTime startTime;

    @NotNull(message = "Thời gian tính đi trễ không được để trống")
    private LocalDateTime lateTime;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    private LocalDateTime endTime;
}