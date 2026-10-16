package com.classmanagement.backend.dto.subject;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SubjectRequest {

    @NotBlank(message = "Tên môn học không được để trống")
    @Size(max = 100, message = "Tên môn học không được vượt quá 100 ký tự")
    private String name;

    @NotBlank(message = "Mã môn học không được để trống")
    @Size(max = 50, message = "Mã môn học không được vượt quá 50 ký tự")
    private String code;

    private String description;
}
