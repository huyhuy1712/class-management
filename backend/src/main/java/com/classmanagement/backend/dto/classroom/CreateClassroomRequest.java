package com.classmanagement.backend.dto.classroom;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateClassroomRequest {

    @NotBlank(message = "Vui lòng nhập tên lớp")
    @Size(max = 100)
    private String name;

    @NotBlank(message = "Vui lòng nhập mã lớp")
    @Size(max = 50)
    private String code;

    @NotNull(message = "Vui lòng chọn môn học")
    private Long subjectId;

    @NotNull(message = "Vui lòng chọn giáo viên")
    private Long teacherId;

    @NotBlank(message = "Vui lòng nhập năm học")
    @Pattern(
            regexp = "^\\d{4}-\\d{4}$",
            message = "Năm học phải có định dạng YYYY-YYYY"
    )
    private String academicYear;

    private String description;
}