package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.subject.SubjectRequest;
import com.classmanagement.backend.dto.subject.SubjectResponse;
import com.classmanagement.backend.entity.Subject;
import com.classmanagement.backend.repository.SubjectRepository;
import com.classmanagement.backend.service.AdminActivityService;
import com.classmanagement.backend.service.SubjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/subjects")
@RequiredArgsConstructor
public class AdminSubjectController {

    private final SubjectService subjectService;
    private final SubjectRepository subjectRepository;
    private final AdminActivityService adminActivityService;

    @GetMapping
    public ResponseEntity<List<SubjectResponse>> getAllSubjects() {
        return ResponseEntity.ok(subjectService.getAllSubjects());
    }

    @PostMapping
    public ResponseEntity<?> createSubject(
            @Valid @RequestBody SubjectRequest request,
            Authentication authentication) {
        try {
            SubjectResponse subject = subjectService.createSubject(request);
            adminActivityService.recordByUsername(
                    authentication.getName(), "CREATE", "SUBJECT", subject.getId(),
                    "Tạo môn học: " + subject.getName() + " (" + subject.getCode() + ")");
            return ResponseEntity.status(HttpStatus.CREATED).body(subject);
        } catch (DataIntegrityViolationException exception) {
            return duplicateCodeResponse();
        }
    }

    @PutMapping("/{subjectId}")
    public ResponseEntity<?> updateSubject(
            @PathVariable Long subjectId,
            @Valid @RequestBody SubjectRequest request,
            Authentication authentication) {
        try {
            SubjectResponse subject = subjectService.updateSubject(subjectId, request);
            adminActivityService.recordByUsername(
                    authentication.getName(), "UPDATE", "SUBJECT", subjectId,
                    "Cập nhật môn học: " + subject.getName() + " (" + subject.getCode() + ")");
            return ResponseEntity.ok(subject);
        } catch (DataIntegrityViolationException exception) {
            return duplicateCodeResponse();
        }
    }

    @DeleteMapping("/{subjectId}")
    public ResponseEntity<?> deleteSubject(
            @PathVariable Long subjectId,
            Authentication authentication) {
        Subject subject = subjectRepository.findById(subjectId).orElse(null);
        try {
            subjectService.deleteSubject(subjectId);
            adminActivityService.recordByUsername(
                    authentication.getName(), "DELETE", "SUBJECT", subjectId,
                    "Xóa môn học: " + (subject == null ? "môn học #" + subjectId
                            : subject.getName() + " (" + subject.getCode() + ")"));
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
