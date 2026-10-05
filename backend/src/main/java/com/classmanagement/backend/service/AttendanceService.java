package com.classmanagement.backend.service;

import java.time.LocalDate;
import java.util.List;

import com.classmanagement.backend.dto.attendance.AttendanceResponse;
import com.classmanagement.backend.dto.attendance.CreateAttendanceRequest;
import com.classmanagement.backend.dto.attendance.StudentAttendanceResponse;

public interface AttendanceService {

List<AttendanceResponse> createAttendance(
            Long classroomId,
            CreateAttendanceRequest request);
            
List<AttendanceResponse> getAttendancesByClassroom(
            Long classroomId);

List<StudentAttendanceResponse> getMyAttendances(String username);

void deleteAttendance(
        Long classroomId,
        Long studentId,
        LocalDate date);
}