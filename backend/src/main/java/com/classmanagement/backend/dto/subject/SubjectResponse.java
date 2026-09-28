package com.classmanagement.backend.dto.subject;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SubjectResponse {

    private Long id;
    private String name;
    private String code;
    private String description;
}