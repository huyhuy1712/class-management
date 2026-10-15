package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.subject.SubjectRequest;
import com.classmanagement.backend.dto.subject.SubjectResponse;
import com.classmanagement.backend.service.SubjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/subjects")
@RequiredArgsConstructor
public class AdminSubjectController {

    private final SubjectService subjectService;

    @GetMapping
    public ResponseEntity<List<SubjectResponse>> getAllSubjects() {
        return ResponseEntity.ok(subjectService.getAllSubjects());
    }

    @PostMapping
    public ResponseEntity<?> createSubject(
            @Valid @RequestBody SubjectRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(subjectService.createSubject(request));
        } catch (DataIntegrityViolationException exception) {
            return duplicateCodeResponse();
        }
    }

    @PutMapping("/{subjectId}")
    public ResponseEntity<?> updateSubject(
            @PathVariable Long subjectId,
            @Valid @RequestBody SubjectRequest request) {
        try {
            return ResponseEntity.ok(subjectService.updateSubject(subjectId, request));
        } catch (DataIntegrityViolationException exception) {
            return duplicateCodeResponse();
        }
    }

    @DeleteMapping("/{subjectId}")
    public ResponseEntity<?> deleteSubject(@PathVariable Long subjectId) {
        try {
            subjectService.deleteSubject(subjectId);
            return ResponseEntity.noContent().build();
        } catch (DataIntegrityViolationException exception) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "message",
                            "Không thể xóa môn học vì đang được sử dụng trong lớp học hoặc bài kiểm tra."));
        }
    }

    private ResponseEntity<?> duplicateCodeResponse() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", "Mã môn học đã tồn tại"));
    }
}
