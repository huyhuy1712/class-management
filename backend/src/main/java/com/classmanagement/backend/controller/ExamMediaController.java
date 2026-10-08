package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.exam.ExamMediaResponse;
import com.classmanagement.backend.entity.enums.ExamMediaType;
import com.classmanagement.backend.service.ExamMediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;

@RestController
@RequestMapping("/api/exam-media")
@RequiredArgsConstructor
public class ExamMediaController {
    private final ExamMediaService examMediaService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ExamMediaResponse> upload(Authentication authentication,
            @RequestParam("draftToken") UUID draftToken, @RequestParam("type") ExamMediaType type,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                examMediaService.upload(authentication.getName(), draftToken, type, file));
    }

    @DeleteMapping("/{mediaId}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable("mediaId") UUID mediaId) {
        examMediaService.deleteTemporary(authentication.getName(), mediaId);
        return ResponseEntity.accepted().build();
    }
}
