package com.classmanagement.backend.service;

import java.time.LocalDate;
import java.util.List;

import com.classmanagement.backend.dto.attendance.AttendanceExportRow.AttendanceExportResult;
import com.classmanagement.backend.dto.attendance.AttendanceResponse;
import com.classmanagement.backend.dto.attendance.CreateAttendanceRequest;
import com.classmanagement.backend.dto.attendance.UpdateAttendanceRequest;

public interface AttendanceService {

List<AttendanceResponse> createAttendance(
            Long classroomId,
            CreateAttendanceRequest request);

List<AttendanceResponse> markAbsentForUnrecordedStudents(
        Long classroomId,
        LocalDate date);
            
List<AttendanceResponse> getAttendancesByClassroom(
            Long classroomId);

void deleteAttendance(
        Long classroomId,
        Long studentId,
        LocalDate date);

AttendanceResponse updateAttendance(
        Long classroomId,
        Long attendanceId,
        UpdateAttendanceRequest request
);

AttendanceExportResult exportAttendance(
        Long classroomId,
        LocalDate date
);      
    
}