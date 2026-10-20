package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.material.MaterialDocumentResponse;
import com.classmanagement.backend.service.MaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class MaterialController {
    private final MaterialService materialService;

    @GetMapping("/{classroomId}/materials")
    public ResponseEntity<List<MaterialDocumentResponse>> getClassDocuments(
            @PathVariable Long classroomId,
            Authentication authentication) {
        return ResponseEntity.ok(
                materialService.getClassDocuments(classroomId, authentication.getName()));
    }
}
