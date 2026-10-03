package com.classmanagement.backend.dto.attendance;

import com.classmanagement.backend.entity.enums.AttendanceStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AttendanceExportRow {

    private String studentCode;

    private String fullName;

    private AttendanceStatus status;
    
    private String reason;

    public record AttendanceExportResult(
            byte[] file,
            String classroomName) {
    }
}