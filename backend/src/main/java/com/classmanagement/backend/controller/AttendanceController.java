package com.classmanagement.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.classmanagement.backend.dto.attendance.AttendanceResponse;
import com.classmanagement.backend.dto.attendance.CreateAttendanceRequest;
import com.classmanagement.backend.service.AttendanceService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

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
}