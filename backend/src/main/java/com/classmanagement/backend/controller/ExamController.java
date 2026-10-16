package com.classmanagement.backend.controller;

import com.classmanagement.backend.service.exam.ExamCreationService;

import com.classmanagement.backend.dto.exam.ExamListResponse;
import com.classmanagement.backend.dto.exam.ExamConfigurationResponse;
import com.classmanagement.backend.service.exam.configuration.ExamConfigurationService;
import com.classmanagement.backend.service.exam.ExamDetailService;
import com.classmanagement.backend.service.exam.content.ExamContentUpdateService;
import com.classmanagement.backend.dto.exam.UpdateExamContentRequest;
import com.classmanagement.backend.dto.exam.UpdateExamContentResponse;
import com.classmanagement.backend.dto.exam.ExamDetailResponse;
import com.classmanagement.backend.service.exam.configuration.ExamConfigurationUpdateService;
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
import org.springframework.web.bind.annotation.PatchMapping;
import com.classmanagement.backend.service.exam.ExamPublishService;
import com.classmanagement.backend.dto.exam.PublishExamResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.http.HttpStatus;
import com.classmanagement.backend.dto.exam.CreateCompleteExamRequest;
import com.classmanagement.backend.dto.exam.CreateExamResponse;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import com.classmanagement.backend.dto.exam.PdfExamImportResponse;
import com.classmanagement.backend.service.exam.pdf.PdfExamImportService;
import org.springframework.http.CacheControl;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;
    private final ExamConfigurationService configurationService;
    private final ExamDetailService detailService;
    private final ExamConfigurationUpdateService configurationUpdateService;
    private final ExamContentUpdateService contentUpdateService;
    private final ExamPublishService publishService;
    private final ExamCreationService creationService;
    private final PdfExamImportService pdfImports;

    @PostMapping(value = "/imports/pdf", consumes = "multipart/form-data")
    public ResponseEntity<PdfExamImportResponse> importPdf(
            @RequestParam MultipartFile file,
            @RequestParam int examNumber,
            @RequestParam UUID requestId,
            Authentication authentication) {
        return ResponseEntity.accepted()
                .cacheControl(CacheControl.noStore())
                .body(pdfImports.upload(authentication.getName(), file, examNumber, requestId));
    }

    @GetMapping("/imports/{importId}")
    public ResponseEntity<PdfExamImportResponse> getImport(
            @PathVariable UUID importId, Authentication authentication) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(pdfImports.get(authentication.getName(), importId));
    }

    @GetMapping(value = "/imports/{importId}/assets/{assetId}", produces = "image/png")
    public ResponseEntity<byte[]> getImportAsset(
            @PathVariable UUID importId,
            @PathVariable UUID assetId,
            Authentication authentication) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header("X-Content-Type-Options", "nosniff")
                .body(pdfImports.asset(authentication.getName(), importId, assetId));
    }

    @PostMapping("/{examId}/copy")
    public ResponseEntity<ExamDetailResponse> copyExam(@PathVariable Long examId,
            @Valid @RequestBody com.classmanagement.backend.dto.exam.CopyExamRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(creationService.copy(examId, auth.getName(), request));
    }
    @PostMapping("/{examId}/assignments")
    public ResponseEntity<ExamConfigurationResponse> createAssignment(@PathVariable Long examId,
            @Valid @RequestBody com.classmanagement.backend.dto.exam.CreateExamAssignmentRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(configurationUpdateService.createAssignment(examId,auth.getName(),request));
    }

    @PatchMapping("/{examId}/publish")
    public ResponseEntity<PublishExamResponse> publish(@PathVariable Long examId, Authentication authentication) {
        return ResponseEntity.ok(publishService.publish(examId, authentication.getName()));
    }

    @PatchMapping("/{examId}/unpublish")
    public ResponseEntity<PublishExamResponse> unpublish(@PathVariable Long examId, Authentication authentication) {
        return ResponseEntity.ok(publishService.unpublish(examId, authentication.getName()));
    }

    @PutMapping("/{examId}/content")
    public ResponseEntity<UpdateExamContentResponse> updateContent(@PathVariable Long examId,
            @Valid @RequestBody UpdateExamContentRequest request, Authentication authentication) {
        return ResponseEntity.ok(contentUpdateService.update(examId, authentication.getName(), request));
    }

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
        pdfImports.requireReviewIfImport(request);
        var created = request.importReview() == null
                ? examService.createCompleteExam(authentication.getName(), request)
                : pdfImports.create(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
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
