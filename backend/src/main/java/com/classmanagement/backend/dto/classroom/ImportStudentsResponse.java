package com.classmanagement.backend.dto.classroom;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportStudentsResponse {

    private int total;

    private int success;

    private int failed;

    private List<ImportStudentErrorResponse> errors;
}