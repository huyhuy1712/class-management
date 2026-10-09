package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.exam.ExamListResponse;
import com.classmanagement.backend.dto.exam.ExamConfigurationResponse;
import com.classmanagement.backend.service.exam.ExamConfigurationService;
import com.classmanagement.backend.service.exam.ExamDetailService;
import com.classmanagement.backend.dto.exam.ExamDetailResponse;
import com.classmanagement.backend.service.exam.ExamConfigurationUpdateService;
import com.classmanagement.backend.dto.exam.UpdateExamRequest;
import com.classmanagement.backend.service.ExamService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.http.HttpStatus;
import com.classmanagement.backend.dto.exam.CreateCompleteExamRequest;
import com.classmanagement.backend.dto.exam.CreateExamResponse;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;
    private final ExamConfigurationService configurationService;
    private final ExamDetailService detailService;
    private final ExamConfigurationUpdateService configurationUpdateService;

    @GetMapping("/{examId}")
    public ResponseEntity<ExamDetailResponse> getDetail(
            @PathVariable Long examId, Authentication authentication) {
        return ResponseEntity.ok(detailService.get(examId, authentication.getName()));
    }

    @GetMapping("/{examId}/configuration")
    public ResponseEntity<ExamConfigurationResponse> getConfiguration(
            @PathVariable Long examId, Authentication authentication) {
        return ResponseEntity.ok(configurationService.get(examId, authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<CreateExamResponse> createCompleteExam(
            Authentication authentication, @Valid @RequestBody CreateCompleteExamRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                examService.createCompleteExam(authentication.getName(), request));
    }

@GetMapping
public ResponseEntity<List<ExamListResponse>> getMyExams(
            Authentication authentication) {
        return ResponseEntity.ok(
                examService.getMyExams(authentication.getName()));
    }

@DeleteMapping("/{examId}")
public ResponseEntity<Void> deleteExam(
        @PathVariable Long examId,
        @RequestParam(defaultValue = "false") boolean force,
        Authentication authentication
) {
    examService.deleteExam(
            examId,
            authentication.getName(),
            force
    );

    return ResponseEntity.noContent().build();
}

@PutMapping("/{examId}")
public ResponseEntity<ExamConfigurationResponse> updateExam(
        @PathVariable Long examId,
        @Valid @RequestBody UpdateExamRequest request,
        Authentication authentication
) {
    return ResponseEntity.ok(
            configurationUpdateService.update(
                    examId,
                    authentication.getName(),
                    request
            )
    );
}

}
