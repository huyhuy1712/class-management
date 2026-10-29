package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.material.MaterialDocumentResponse;
import com.classmanagement.backend.entity.enums.MaterialAssignmentType;
import com.classmanagement.backend.service.MaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/materials")
@RequiredArgsConstructor
public class TeacherMaterialController {
    private final MaterialService materialService;

    @GetMapping
    public ResponseEntity<List<MaterialDocumentResponse>> getTeacherDocuments(
            Authentication authentication) {
        return ResponseEntity.ok(materialService.getTeacherDocuments(authentication.getName()));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MaterialDocumentResponse> uploadDocument(
            Authentication authentication,
            @RequestParam String title,
            @RequestParam(required = false) String content,
            @RequestParam MaterialAssignmentType assignmentType,
            @RequestParam(required = false) List<Long> classIds,
            @RequestParam(required = false) List<Long> studentIds,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(materialService.uploadDocument(
                authentication.getName(), title, content, assignmentType, classIds, studentIds, file));
    }

    @PostMapping(value = "/batch", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<MaterialDocumentResponse>> uploadDocuments(
            Authentication authentication,
            @RequestParam(required = false) String content,
            @RequestParam MaterialAssignmentType assignmentType,
            @RequestParam(required = false) List<Long> classIds,
            @RequestParam(required = false) List<Long> studentIds,
            @RequestParam("files") List<MultipartFile> files) {
        return ResponseEntity.status(HttpStatus.CREATED).body(materialService.uploadDocuments(
                authentication.getName(), content, assignmentType, classIds, studentIds, files));
    }

    @PutMapping(value = "/{materialId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MaterialDocumentResponse> updateDocument(
            Authentication authentication,
            @PathVariable Long materialId,
            @RequestParam String title,
            @RequestParam(required = false) String content,
            @RequestParam MaterialAssignmentType assignmentType,
            @RequestParam(required = false) List<Long> classIds,
            @RequestParam(required = false) List<Long> studentIds,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        return ResponseEntity.ok(materialService.updateDocument(materialId, authentication.getName(),
                title, content, assignmentType, classIds, studentIds, file));
    }

    @DeleteMapping("/{materialId}")
    public ResponseEntity<Void> deleteDocument(
            Authentication authentication,
            @PathVariable Long materialId) {
        materialService.deleteDocument(materialId, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{materialId}/classes/{classroomId}")
    public ResponseEntity<Void> removeDocumentFromClass(
            Authentication authentication,
            @PathVariable Long materialId,
            @PathVariable Long classroomId) {
        materialService.removeDocumentFromClass(materialId, classroomId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
