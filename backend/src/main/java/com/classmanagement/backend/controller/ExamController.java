package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.exam.ExamListResponse;
import com.classmanagement.backend.service.ExamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;

    @GetMapping
    public ResponseEntity<List<ExamListResponse>> getMyExams(
            Authentication authentication) {
        return ResponseEntity.ok(
                examService.getMyExams(authentication.getName()));
    }
}