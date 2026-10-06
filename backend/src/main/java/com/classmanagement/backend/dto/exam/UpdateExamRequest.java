package com.classmanagement.backend.dto.exam;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateExamRequest(

        @NotBlank(message = "Tên đề thi không được để trống") @Size(max = 255, message = "Tên đề thi không được vượt quá 255 ký tự") String title,

        String description,

        @Size(max = 30, message = "Khối/lớp không được vượt quá 30 ký tự") String gradeLevel,

        @Size(max = 50, message = "Mục đích không được vượt quá 50 ký tự") String purpose,

        @NotNull(message = "Môn học không được để trống") Long subjectId) {
}