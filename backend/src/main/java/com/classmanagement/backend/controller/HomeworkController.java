package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.homework.HomeworkDtos;
import com.classmanagement.backend.entity.enums.MaterialAssignmentType;
import com.classmanagement.backend.service.homework.HomeworkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/homework-assignments")
@RequiredArgsConstructor
public class HomeworkController {
    private final HomeworkService homework;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<HomeworkDtos.Assignment> create(
            Authentication authentication,
            @RequestParam String title,
            @RequestParam(required = false) String instructions,
            @RequestParam MaterialAssignmentType assignmentType,
            @RequestParam(required = false) List<Long> classIds,
            @RequestParam(required = false) List<Long> studentIds,
            @RequestParam(required = false) String dueAt,
            @RequestParam(defaultValue = "10") String maxScore,
            @RequestParam(required = false) MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(homework.create(authentication.getName(), title, instructions, assignmentType,
                        classIds, studentIds, dueAt, maxScore, file));
    }

    @GetMapping
    public List<HomeworkDtos.Assignment> listForTeacher(Authentication authentication) {
        return homework.listForTeacher(authentication.getName(), null);
    }

    @GetMapping("/classes/{classId}")
    public List<HomeworkDtos.Assignment> listForTeacherClass(
            @PathVariable long classId, Authentication authentication) {
        return homework.listForTeacher(authentication.getName(), classId);
    }

    @GetMapping("/me")
    public List<HomeworkDtos.StudentAssignment> listForStudent(Authentication authentication) {
        return homework.listForStudent(authentication.getName());
    }

    @GetMapping("/{assignmentId}")
    public HomeworkDtos.Assignment getForTeacher(
            @PathVariable long assignmentId, Authentication authentication) {
        return homework.getForTeacher(assignmentId, authentication.getName());
    }

    @GetMapping("/{assignmentId}/submissions")
    public List<HomeworkDtos.Submission> submissions(
            @PathVariable long assignmentId,
            @RequestParam(required = false) Long classId,
            Authentication authentication) {
        return homework.submissions(assignmentId, classId, authentication.getName());
    }

    @PutMapping("/{assignmentId}/deadline")
    public HomeworkDtos.Assignment updateDeadline(
            @PathVariable long assignmentId,
            @Valid @RequestBody HomeworkDtos.DeadlineRequest request,
            Authentication authentication) {
        return homework.updateDeadline(assignmentId, request.dueAt(), authentication.getName());
    }

    @PostMapping("/{assignmentId}/submissions/{studentId}/reopen")
    public void reopen(
            @PathVariable long assignmentId,
            @PathVariable long studentId,
            Authentication authentication) {
        homework.reopen(assignmentId, studentId, authentication.getName());
    }

    @PutMapping("/{assignmentId}/submissions/{studentId}/grade")
    public HomeworkDtos.Submission grade(
            @PathVariable long assignmentId,
            @PathVariable long studentId,
            @Valid @RequestBody HomeworkDtos.GradeRequest request,
            Authentication authentication) {
        return homework.grade(assignmentId, studentId, request, authentication.getName());
    }

    @GetMapping("/{assignmentId}/me")
    public HomeworkDtos.StudentAssignment getForStudent(
            @PathVariable long assignmentId, Authentication authentication) {
        return homework.getForStudent(assignmentId, authentication.getName());
    }

    @PutMapping(value = "/{assignmentId}/submission", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public HomeworkDtos.StudentAssignment submit(
            @PathVariable long assignmentId,
            Authentication authentication,
            @RequestParam(required = false) String answerText,
            @RequestParam(required = false) List<MultipartFile> images) {
        return homework.submit(assignmentId, authentication.getName(), answerText, images);
    }
}
