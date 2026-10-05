package com.classmanagement.backend.dto.user;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class StudentDashboardResponse {

    private String fullName;
    private List<StudentClassResponse> classes;
    private long attendanceCount;
    private long attendedCount;
    private double attendanceRate;
}