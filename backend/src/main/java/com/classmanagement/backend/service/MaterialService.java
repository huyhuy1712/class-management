package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.material.MaterialDocumentResponse;
import com.classmanagement.backend.entity.enums.MaterialAssignmentType;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface MaterialService {
    List<MaterialDocumentResponse> getClassDocuments(Long classroomId, String username);

    List<MaterialDocumentResponse> getTeacherDocuments(String username);

    MaterialDocumentResponse uploadDocument(
            String username,
            String title,
            String content,
            MaterialAssignmentType assignmentType,
            List<Long> classIds,
            List<Long> studentIds,
            MultipartFile file);

    List<MaterialDocumentResponse> uploadDocuments(
            String username,
            String content,
            MaterialAssignmentType assignmentType,
            List<Long> classIds,
            List<Long> studentIds,
            List<MultipartFile> files);

    MaterialDocumentResponse updateDocument(
            Long materialId,
            String username,
            String title,
            String content,
            MaterialAssignmentType assignmentType,
            List<Long> classIds,
            List<Long> studentIds,
            MultipartFile file);

    void deleteDocument(Long materialId, String username);

    void removeDocumentFromClass(Long materialId, Long classroomId, String username);

    void cleanupClassAssignments(Long classroomId);

    void cleanupStudentAssignments(Long studentId);

    void cleanupStudentAssignmentsForMembership(Long classroomId, Long studentId);

    void cleanupStudentAssignmentsForClass(Long classroomId);

    void cleanupTeacherDocuments(Long teacherId);
}
