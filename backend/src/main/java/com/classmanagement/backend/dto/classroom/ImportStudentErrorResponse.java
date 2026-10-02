package com.classmanagement.backend.dto.classroom;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportStudentErrorResponse {

    private int row;

    private String studentCode;

    private String message;
}