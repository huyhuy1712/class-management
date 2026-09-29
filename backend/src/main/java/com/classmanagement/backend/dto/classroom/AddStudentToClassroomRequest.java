package com.classmanagement.backend.dto.classroom;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddStudentToClassroomRequest {

    @NotNull(message = "Id học sinh là bắt buộc")
    private Long studentId;
}