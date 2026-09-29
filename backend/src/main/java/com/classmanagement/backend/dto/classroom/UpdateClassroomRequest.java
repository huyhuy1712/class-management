package com.classmanagement.backend.dto.classroom;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateClassroomRequest {

    @NotBlank(message = "Class name is required")
    @Size(max = 100, message = "Class name must not exceed 100 characters")
    private String name;

    @NotBlank(message = "Class code is required")
    @Size(max = 50, message = "Class code must not exceed 50 characters")
    private String code;

    @NotNull(message = "Subject is required")
    private Long subjectId;

    @NotNull(message = "Teacher is required")
    private Long teacherId;

    @Size(max = 9, message = "Academic year must not exceed 9 characters")
    private String academicYear;

    private String description;
}