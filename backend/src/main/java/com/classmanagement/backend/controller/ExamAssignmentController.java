package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.exam.StudentExamResponse;
import com.classmanagement.backend.dto.exam.ExamAttemptPayload;
import com.classmanagement.backend.dto.exam.ExamAttemptResponse;
import com.classmanagement.backend.entity.enums.ExamAttemptStatus;
import com.classmanagement.backend.service.exam.ExamAttemptService;
import jakarta.validation.Valid;
import com.classmanagement.backend.service.exam.StudentExamReadService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/exam-assignments")
@RequiredArgsConstructor
public class ExamAssignmentController {
    private final StudentExamReadService readService;
    private final ExamAttemptService attempts;

    @PostMapping("/{assignmentId}/attempts")
    public ExamAttemptResponse start(@PathVariable Long assignmentId,@Valid @RequestBody ExamAttemptPayload.Start body,Authentication auth) {
        return attempts.start(assignmentId,auth.getName(),body);
    }
    @GetMapping("/{assignmentId}/attempts")
    public ExamAttemptResponse.Page submissions(@PathVariable Long assignmentId,
            @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size,
            @RequestParam(required=false) ExamAttemptStatus status,@RequestParam(required=false) String q,
            @RequestParam(defaultValue="newest") String sort,@RequestParam(required=false) Long classId,
            @RequestParam(defaultValue="false") boolean export,Authentication auth) {
        return export
                ? attempts.listForExport(assignmentId,auth.getName(),page,size,status,q,sort,classId)
                : attempts.list(assignmentId,auth.getName(),page,size,status,q,sort,classId);
    }

    @GetMapping("/{assignmentId}")
    public StudentExamResponse getForStudent(@PathVariable long assignmentId, Authentication authentication) {
        return readService.detail(authentication.getName(), assignmentId);
    }
}
