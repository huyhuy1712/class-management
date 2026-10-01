package com.classmanagement.backend.dto.user;

import com.classmanagement.backend.entity.enums.ClassroomStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StudentClassResponse {

    private Long id;

    private String name;

    private String code;

    private String academicYear;

    private ClassroomStatus status;
}