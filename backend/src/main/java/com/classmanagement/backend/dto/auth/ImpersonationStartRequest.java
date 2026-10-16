package com.classmanagement.backend.dto.auth;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ImpersonationStartRequest {

    @Size(max = 500, message = "Lý do không được vượt quá 500 ký tự")
    private String reason;
}
