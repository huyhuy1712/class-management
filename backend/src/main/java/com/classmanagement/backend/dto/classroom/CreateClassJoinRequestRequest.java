package com.classmanagement.backend.dto.classroom;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateClassJoinRequestRequest {

    @Size(max = 500, message = "Lời nhắn không được vượt quá 500 ký tự")
    private String message;
}