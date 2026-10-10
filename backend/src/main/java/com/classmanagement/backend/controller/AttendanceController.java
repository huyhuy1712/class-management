package com.classmanagement.backend.controller;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import com.classmanagement.backend.dto.attendance.AttendanceExportRow.AttendanceExportResult;
import com.classmanagement.backend.dto.attendance.AttendanceResponse;
import com.classmanagement.backend.dto.attendance.CreateAttendanceRequest;
import com.classmanagement.backend.dto.attendance.StudentAttendanceResponse;
import com.classmanagement.backend.dto.attendance.UpdateAttendanceRequest;
import com.classmanagement.backend.service.AttendanceService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class AttendanceController {

private final AttendanceService attendanceService;
private final jakarta.validation.Validator validator;

@PostMapping("/{classroomId}/attendances")
public ResponseEntity<?> createAttendance(
            @PathVariable Long classroomId,
            @RequestBody CreateAttendanceRequest request,
            org.springframework.security.core.Authentication authentication) {
        boolean student = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_STUDENT") || authority.getAuthority().equals("STUDENT"));
        if (student) {
            try {
                return ResponseEntity.status(HttpStatus.CREATED).body(attendanceService.attendAsStudent(
                        classroomId, authentication.getName(), request.getAttendanceCode(), request.getNote()));
            } catch (com.classmanagement.backend.exception.LateAttendanceReasonRequiredException exception) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(java.util.Map.of(
                        "code", "LATE_REASON_REQUIRED", "message", exception.getMessage()));
            }
        }
        var violations = validator.validate(request);
        if (!violations.isEmpty()) throw new IllegalArgumentException(violations.iterator().next().getMessage());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body( attendanceService.createAttendance( classroomId, request));
    }

@PostMapping("/{classroomId}/attendances/absent-all")
public ResponseEntity<List<AttendanceResponse>> markAbsentForUnrecordedStudents(
        @PathVariable Long classroomId,
        @RequestParam
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate date
) {
    return ResponseEntity.ok(
            attendanceService.markAbsentForUnrecordedStudents(
                    classroomId,
                    date
            )
    );
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

@PatchMapping("/{classroomId}/attendances/{attendanceId}")
public ResponseEntity<AttendanceResponse> updateAttendance(
        @PathVariable Long classroomId,
        @PathVariable Long attendanceId,
        @RequestBody UpdateAttendanceRequest request
) {
    return ResponseEntity.ok(
            attendanceService.updateAttendance(
                    classroomId,
                    attendanceId,
                    request
            )
    );
}


@GetMapping("/{classroomId}/attendances/export")
public ResponseEntity<byte[]> exportAttendance(
        @PathVariable Long classroomId,
        @RequestParam
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate date
) {
    AttendanceExportResult result =
            attendanceService.exportAttendance(
                    classroomId,
                    date
            );

    String fileName = buildAttendanceFileName(
            result.classroomName(),
            date
    );

    ContentDisposition contentDisposition =
            ContentDisposition.attachment()
                    .filename(
                            fileName,
                            StandardCharsets.UTF_8
                    )
                    .build();

    return ResponseEntity.ok()
            .header(
                    HttpHeaders.CONTENT_DISPOSITION,
                    contentDisposition.toString()
            )
            .contentType(
                    MediaType.parseMediaType(
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    )
            )
            .body(result.file());
}

// Helpers
private String buildAttendanceFileName(
                String classroomName,
                LocalDate date) {
        String safeClassroomName = classroomName
                        .trim()
                        .replaceAll("[\\\\/:*?\"<>|]", "_")
                        .replaceAll("\\s+", "_");

        String formattedDate = date.format(
                        DateTimeFormatter.ofPattern(
                                        "dd-MM-yyyy"));

        return "diemdanh_"
                        + safeClassroomName
                        + "_"
                        + formattedDate
                        + ".xlsx";
}

}
