package com.classmanagement.backend.service.impl.material;

import com.classmanagement.backend.dto.material.MaterialDocumentResponse;
import com.classmanagement.backend.entity.Material;
import com.classmanagement.backend.entity.MaterialAssignment;
import com.classmanagement.backend.entity.MaterialAssignmentClass;
import com.classmanagement.backend.entity.MaterialAssignmentExcludedClass;
import com.classmanagement.backend.entity.MaterialAssignmentStudent;
import com.classmanagement.backend.entity.enums.MaterialAssignmentType;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.repository.MaterialAssignmentClassRepository;
import com.classmanagement.backend.repository.MaterialAssignmentExcludedClassRepository;
import com.classmanagement.backend.repository.MaterialAssignmentRepository;
import com.classmanagement.backend.repository.MaterialAssignmentStudentRepository;
import com.classmanagement.backend.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class MaterialDocumentMapper {
    private final MaterialAssignmentRepository assignmentRepository;
    private final MaterialAssignmentClassRepository assignmentClassRepository;
    private final MaterialAssignmentExcludedClassRepository excludedClassRepository;
    private final MaterialAssignmentStudentRepository assignmentStudentRepository;
    private final StorageService storageService;

    public List<MaterialDocumentResponse> map(List<Material> materials) {
        if (materials.isEmpty()) {
            return List.of();
        }
        List<Long> materialIds = materials.stream().map(Material::getId).toList();
        List<MaterialAssignment> assignments = assignmentRepository.findAllByMaterial_IdIn(materialIds);
        Map<Long, MaterialAssignment> assignmentsByMaterial = assignments.stream()
                .collect(Collectors.toMap(assignment -> assignment.getMaterial().getId(), Function.identity()));
        List<Long> assignmentIds = assignments.stream().map(MaterialAssignment::getId).toList();
        Map<Long, List<Long>> classIdsByAssignment = new HashMap<>();
        Map<Long, List<Long>> excludedIdsByAssignment = new HashMap<>();
        Map<Long, List<Long>> studentIdsByAssignment = new HashMap<>();
        Map<Long, Map<Long, Long>> studentClassIdsByAssignment = new HashMap<>();
        if (!assignmentIds.isEmpty()) {
            assignmentClassRepository.findAllById_AssignmentIdIn(assignmentIds).forEach(target ->
                    classIdsByAssignment.computeIfAbsent(target.getId().getAssignmentId(), ignored -> new ArrayList<>())
                            .add(target.getId().getClassId()));
            excludedClassRepository.findAllById_AssignmentIdIn(assignmentIds).forEach(target ->
                    excludedIdsByAssignment.computeIfAbsent(target.getId().getAssignmentId(), ignored -> new ArrayList<>())
                            .add(target.getId().getClassId()));
            assignmentStudentRepository.findAllById_AssignmentIdIn(assignmentIds).forEach(target -> {
                Long assignmentId = target.getId().getAssignmentId();
                Long studentId = target.getId().getStudentId();
                studentIdsByAssignment.computeIfAbsent(assignmentId, ignored -> new ArrayList<>()).add(studentId);
                Long targetClassId = target.getClassroom() == null ? null : target.getClassroom().getId();
                studentClassIdsByAssignment.computeIfAbsent(assignmentId, ignored -> new HashMap<>())
                        .put(studentId, targetClassId);
            });
        }

        return materials.stream()
                .map(material -> {
                    MaterialAssignment assignment = assignmentsByMaterial.get(material.getId());
                    Long assignmentId = assignment == null ? null : assignment.getId();
                    return toResponse(material, assignment,
                            classIdsByAssignment.getOrDefault(assignmentId, List.of()),
                            excludedIdsByAssignment.getOrDefault(assignmentId, List.of()),
                            studentIdsByAssignment.getOrDefault(assignmentId, List.of()),
                            studentClassIdsByAssignment.getOrDefault(assignmentId, Map.of()));
                })
                .toList();
    }

    public boolean isVisibleInClass(
            MaterialDocumentResponse document,
            Long classroomId,
            Set<Long> studentIdsInClass,
            UserRole viewerRole) {
        if (document.getTargetType() == null) {
            return false;
        }
        return switch (MaterialAssignmentType.valueOf(document.getTargetType())) {
            case ALL -> document.getExcludedClassIds().stream().noneMatch(id -> id.equals(classroomId));
            case CLASS -> document.getClassIds().stream().anyMatch(id -> id.equals(classroomId));
            case STUDENT -> {
                if (viewerRole == UserRole.STUDENT) {
                    Long studentId = studentIdsInClass.iterator().next();
                    Long targetClassId = document.getStudentClassIds().get(studentId);
                    yield document.getStudentIds().contains(studentId)
                            && (targetClassId == null || targetClassId.equals(classroomId));
                }
                yield document.getStudentIds().stream()
                        .filter(studentIdsInClass::contains)
                        .anyMatch(studentId -> {
                            Long targetClassId = document.getStudentClassIds().get(studentId);
                            return targetClassId == null || targetClassId.equals(classroomId);
                        });
            }
        };
    }

    private MaterialDocumentResponse toResponse(
            Material material,
            MaterialAssignment assignment,
            List<Long> classIds,
            List<Long> excludedClassIds,
            List<Long> studentIds,
            Map<Long, Long> studentClassIds) {
        String objectPath = material.getFileUrl();
        String fileUrl = objectPath == null || objectPath.isBlank()
                ? null
                : objectPath.startsWith("http://") || objectPath.startsWith("https://")
                        ? objectPath
                        : storageService.getUrl(objectPath);
        String fileName = material.getFileName();
        if ((fileName == null || fileName.isBlank()) && objectPath != null) {
            fileName = objectPath.substring(objectPath.lastIndexOf('/') + 1);
        }
        return MaterialDocumentResponse.builder()
                .id(material.getId())
                .title(material.getTitle())
                .content(material.getContent())
                .fileUrl(fileUrl)
                .fileName(fileName)
                .fileSize(material.getFileSize())
                .fileContentType(material.getFileContentType())
                .source("UPLOAD")
                .targetType(assignment == null ? null : assignment.getAssignmentType().name())
                .classIds(classIds)
                .excludedClassIds(excludedClassIds)
                .studentIds(studentIds)
                .studentClassIds(studentClassIds)
                .createdAt(material.getCreatedAt())
                .build();
    }
}
