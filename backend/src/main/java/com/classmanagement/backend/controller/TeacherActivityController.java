package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.activity.TeacherActivityResponse;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.service.TeacherActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/teacher/activity")
@RequiredArgsConstructor
public class TeacherActivityController {

    private final TeacherActivityService activityService;
    private final UserRepository userRepository;

    @GetMapping
    public TeacherActivityResponse getActivity(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "newest") String sort) {
        var teacher = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng."));
        if (teacher.getRole() != UserRole.TEACHER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Chỉ giáo viên mới có thể xem lịch sử hoạt động.");
        }

        return activityService.getActivity(teacher.getId(), page, size, q, category, from, to, sort);
    }
}
