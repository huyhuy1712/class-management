package com.classmanagement.backend.service;

import java.util.List;

import com.classmanagement.backend.dto.attendance.AttendanceResponse;
import com.classmanagement.backend.dto.attendance.CreateAttendanceRequest;

public interface AttendanceService {

    List<AttendanceResponse> createAttendance(
            Long classroomId,
            CreateAttendanceRequest request);
            
    List<AttendanceResponse> getAttendancesByClassroom(
            Long classroomId);
}