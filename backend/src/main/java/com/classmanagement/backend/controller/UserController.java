package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.classroom.ClassroomResponse;

import com.classmanagement.backend.dto.user.ChangePasswordRequest;
import com.classmanagement.backend.dto.user.TeacherStudentResponse;
import com.classmanagement.backend.dto.user.StudentDashboardResponse;

import com.classmanagement.backend.dto.user.UpdateProfileRequest;
import com.classmanagement.backend.dto.user.UserResponse;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.service.UserService;
import com.classmanagement.backend.service.StudentProfileStatsService;
import com.classmanagement.backend.dto.user.StudentExamCountResponse;
import com.classmanagement.backend.dto.exam.StudentExamResponse;
import com.classmanagement.backend.service.exam.StudentExamReadService;
import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final StudentProfileStatsService profileStats;
    private final StudentExamReadService studentExams;

    @GetMapping("/me/exams")
    public StudentExamResponse.Page getMyAssignedExams(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q, @RequestParam(required = false) Long classId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "newest") String sort) {
        return studentExams.list(authentication.getName(), page, size, q, classId, date, sort);
    }

    @GetMapping("/me/classes")
    public ResponseEntity<List<ClassroomResponse>> getMyStudentClasses(
            Authentication authentication) {
        return ResponseEntity.ok(userService.getMyStudentClasses(authentication.getName()));
    }

    @GetMapping("/me/student-exam-count")
    public ResponseEntity<StudentExamCountResponse> getStudentExamCount(Authentication authentication) {
        return ResponseEntity.ok(profileStats.getExamCount(authentication.getName()));
    }


@GetMapping
public ResponseEntity<List<UserResponse>> getAllUsers(
            @RequestParam(required = false) UserRole role
    ) {

        return ResponseEntity.ok(
                userService.getAllUsers(role)
    );
}

@PutMapping("/me")
public ResponseEntity<UserResponse> updateMyProfile(
        Authentication authentication,
        @Valid @RequestBody UpdateProfileRequest request) {
return ResponseEntity.ok(
        userService.updateMyProfile(
                authentication.getName(),
                request));
}

@GetMapping("/{userId}")
public ResponseEntity<UserResponse> getUserById(
        @PathVariable Long userId) {
    return ResponseEntity.ok(
            userService.getUserById(userId));
}

@GetMapping("/my-students")
public ResponseEntity<List<TeacherStudentResponse>> getMyStudents(
        Authentication authentication
) {

    return ResponseEntity.ok(
            userService.getMyStudents(
                    authentication.getName()
            )
    );
}
@GetMapping("/me/student-dashboard")
public ResponseEntity<StudentDashboardResponse> getMyStudentDashboard(
                Authentication authentication) {
        return ResponseEntity.ok(
                        userService.getMyStudentDashboard(authentication.getName()));
}

@PutMapping("/me/password")
public ResponseEntity<Void> changePassword(
        Authentication authentication,
        @Valid @RequestBody ChangePasswordRequest request
) {
    userService.changePassword(
            authentication.getName(),
            request
    );

    return ResponseEntity.noContent().build();
}

}
