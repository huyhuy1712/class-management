package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.material.MaterialDocumentResponse;

import java.util.List;

public interface MaterialService {
    List<MaterialDocumentResponse> getClassDocuments(Long classroomId, String username);
}
