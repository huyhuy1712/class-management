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

    @NotBlank(message = "Class name is required")
    @Size(max = 100)
    private String name;

    @NotBlank(message = "Class code is required")
    @Size(max = 50)
    private String code;

    @NotNull(message = "Subject is required")
    private Long subjectId;

    @NotNull(message = "Teacher is required")
    private Long teacherId;

    @NotBlank(message = "Academic year is required")
    @Pattern(
            regexp = "^\\d{4}-\\d{4}$",
            message = "Academic year must have format YYYY-YYYY"
    )
    private String academicYear;

    private String description;
}