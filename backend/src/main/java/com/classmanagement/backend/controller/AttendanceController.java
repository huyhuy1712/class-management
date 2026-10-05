package com.classmanagement.backend.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.classmanagement.backend.dto.attendance.AttendanceResponse;
import com.classmanagement.backend.dto.attendance.CreateAttendanceRequest;
import com.classmanagement.backend.dto.attendance.StudentAttendanceResponse;
import com.classmanagement.backend.service.AttendanceService;
import org.springframework.security.core.Authentication;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class AttendanceController {

private final AttendanceService attendanceService;

@GetMapping("/student/attendance")
public ResponseEntity<List<StudentAttendanceResponse>> getMyAttendances(
    Authentication authentication) {
    return ResponseEntity.ok(
        attendanceService.getMyAttendances(authentication.getName()));
}

@PostMapping("/{classroomId}/attendances")
public ResponseEntity<List<AttendanceResponse>> createAttendance(
            @PathVariable Long classroomId,
            @Valid @RequestBody CreateAttendanceRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body( attendanceService.createAttendance( classroomId, request));
    }

@GetMapping("/{classroomId}/attendances")
public ResponseEntity<List<AttendanceResponse>> getAttendances(
            @PathVariable Long classroomId) {
        return ResponseEntity.ok(
                attendanceService.getAttendancesByClassroom(classroomId));
    }

@DeleteMapping("/{classroomId}/attendances/students/{studentId}")
public ResponseEntity<Void> deleteAttendance(
        @PathVariable Long classroomId,
        @PathVariable Long studentId,
        @RequestParam LocalDate date
) {
    attendanceService.deleteAttendance(
            classroomId,
            studentId,
            date
    );

    return ResponseEntity.noContent().build();
}

}