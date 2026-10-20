package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.material.MaterialDocumentResponse;
import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.entity.Material;
import com.classmanagement.backend.entity.MaterialAssignment;
import com.classmanagement.backend.entity.MaterialAssignmentClass;
import com.classmanagement.backend.entity.MaterialAssignmentExcludedClass;
import com.classmanagement.backend.entity.MaterialAssignmentStudent;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.compositeID.MaterialAssignmentClassId;
import com.classmanagement.backend.entity.compositeID.MaterialAssignmentExcludedClassId;
import com.classmanagement.backend.entity.enums.MaterialAssignmentType;
import com.classmanagement.backend.entity.enums.MaterialType;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.repository.MaterialAssignmentClassRepository;
import com.classmanagement.backend.repository.MaterialAssignmentExcludedClassRepository;
import com.classmanagement.backend.repository.MaterialAssignmentRepository;
import com.classmanagement.backend.repository.MaterialAssignmentStudentRepository;
import com.classmanagement.backend.repository.MaterialRepository;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import com.classmanagement.backend.repository.classroom.ClassroomRepository;
import com.classmanagement.backend.service.MaterialService;
import com.classmanagement.backend.service.StorageService;
import com.classmanagement.backend.service.impl.material.MaterialAssignmentManager;
import com.classmanagement.backend.service.impl.material.MaterialDistribution;
import com.classmanagement.backend.service.impl.material.MaterialDocumentMapper;
import com.classmanagement.backend.service.impl.material.MaterialFileSupport;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaterialServiceImpl implements MaterialService {

    private final MaterialRepository materialRepository;
    private final MaterialAssignmentRepository assignmentRepository;
    private final MaterialAssignmentClassRepository assignmentClassRepository;
    private final MaterialAssignmentStudentRepository assignmentStudentRepository;
    private final MaterialAssignmentExcludedClassRepository excludedClassRepository;
    private final ClassroomRepository classroomRepository;
    private final ClassStudentRepository classStudentRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final MaterialAssignmentManager assignmentManager;
    private final MaterialDocumentMapper documentMapper;
    private final MaterialFileSupport fileSupport;

    @Override
    @Transactional(readOnly = true)
    public List<MaterialDocumentResponse> getTeacherDocuments(String username) {
        User teacher = requireTeacher(username);
        List<Material> materials = materialRepository.findAllByTeacher_IdAndTypeOrderByCreatedAtDesc(
                teacher.getId(), MaterialType.DOCUMENT);
        return documentMapper.map(materials);
    }

    @Override
    @Transactional
    public MaterialDocumentResponse uploadDocument(
            String username,
            String title,
            String content,
            MaterialAssignmentType assignmentType,
            List<Long> classIds,
            List<Long> studentIds,
            MultipartFile file) {
        User teacher = requireTeacher(username);
        String normalizedTitle = title == null ? "" : title.trim();
        if (normalizedTitle.isEmpty() || normalizedTitle.length() > 255) {
            throw new IllegalArgumentException("Tên tài liệu không được để trống và tối đa 255 ký tự");
        }
        String extension = fileSupport.validateFile(file);
        String originalName = fileSupport.originalFileName(file);
        fileSupport.validateOriginalFileName(originalName);
        MaterialDistribution distribution = assignmentManager.validateDistribution(
                teacher.getId(), assignmentType, classIds, studentIds);

        String safeExtension = extension.isBlank() ? "" : "." + extension;
        String folder = "materials/teachers/" + teacher.getId() + "/" + UUID.randomUUID();
        MultipartFile typedFile = fileSupport.withContentType(file, fileSupport.contentTypeFor(extension));
        String objectPath;
        try {
            objectPath = storageService.upload(folder, "document" + safeExtension, typedFile);
        } catch (IllegalStateException error) {
            log.error("Could not upload material file for teacher {}", teacher.getId(), error);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Không thể tải tệp tài liệu lên storage", error);
        }
        try {
            Material material = materialRepository.saveAndFlush(Material.builder()
                    .teacher(teacher)
                    .type(MaterialType.DOCUMENT)
                    .title(normalizedTitle)
                    .content(content == null || content.isBlank() ? null : content.trim())
                    .fileUrl(objectPath)
                    .fileName(originalName == null ? "document" + safeExtension : originalName)
                    .fileSize(file.getSize())
                    .fileContentType(typedFile.getContentType())
                    .build());

            MaterialAssignment assignment = assignmentRepository.saveAndFlush(MaterialAssignment.builder()
                    .material(material)
                    .assignmentType(assignmentType)
                    .build());

            assignmentManager.replaceTargets(assignment, assignmentType, distribution);
            return documentMapper.map(List.of(material)).getFirst();
        } catch (RuntimeException error) {
            try {
                storageService.delete(objectPath);
            } catch (RuntimeException cleanupError) {
                error.addSuppressed(cleanupError);
                log.error("Uploaded material file could not be cleaned after database failure: {}", objectPath);
            }
            throw error;
        }
    }

    @Override
    @Transactional
    public MaterialDocumentResponse updateDocument(
            Long materialId,
            String username,
            String title,
            String content,
            MaterialAssignmentType assignmentType,
            List<Long> classIds,
            List<Long> studentIds,
            MultipartFile file) {
        User teacher = requireTeacher(username);
        Material material = materialRepository.findByIdAndTeacher_Id(materialId, teacher.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu"));
        String normalizedTitle = title == null ? "" : title.trim();
        if (normalizedTitle.isEmpty() || normalizedTitle.length() > 255) {
            throw new IllegalArgumentException("Tên tài liệu không được để trống và tối đa 255 ký tự");
        }
        MaterialDistribution distribution = assignmentManager.validateDistribution(
                teacher.getId(), assignmentType, classIds, studentIds);

        String previousPath = material.getFileUrl();
        String replacementPath = null;
        String replacementContentType = null;
        if (file != null && !file.isEmpty()) {
            String extension = fileSupport.validateFile(file);
            fileSupport.validateOriginalFileName(fileSupport.originalFileName(file));
            String folder = "materials/teachers/" + teacher.getId() + "/" + UUID.randomUUID();
            MultipartFile typedFile = fileSupport.withContentType(file, fileSupport.contentTypeFor(extension));
            replacementContentType = typedFile.getContentType();
            try {
                replacementPath = storageService.upload(folder, "document." + extension, typedFile);
            } catch (IllegalStateException error) {
                log.error("Could not replace material file {} for teacher {}", materialId, teacher.getId(), error);
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Không thể tải tệp tài liệu lên storage", error);
            }
        }

        try {
            if (replacementPath != null) {
                material.setFileUrl(replacementPath);
                material.setFileName(fileSupport.originalFileName(file));
                material.setFileSize(file.getSize());
                material.setFileContentType(replacementContentType);
            }
            material.setTitle(normalizedTitle);
            material.setContent(content == null || content.isBlank() ? null : content.trim());
            materialRepository.saveAndFlush(material);

            assignmentManager.updateAssignment(material, assignmentType, distribution);
            materialRepository.flush();

            if (replacementPath != null && previousPath != null && !previousPath.equals(replacementPath)) {
                fileSupport.scheduleDelete(previousPath);
            }
            return documentMapper.map(List.of(material)).getFirst();
        } catch (RuntimeException error) {
            if (replacementPath != null) {
                try {
                    storageService.delete(replacementPath);
                } catch (RuntimeException cleanupError) {
                    error.addSuppressed(cleanupError);
                    log.error("Replacement material file could not be cleaned after database failure: {}",
                            replacementPath);
                }
            }
            throw error;
        }
    }

    @Override
    @Transactional
    public void deleteDocument(Long materialId, String username) {
        User teacher = requireTeacher(username);
        Material material = materialRepository.findByIdAndTeacher_Id(materialId, teacher.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu"));
        String objectPath = material.getFileUrl();
        materialRepository.delete(material);
        materialRepository.flush();
        fileSupport.scheduleDelete(objectPath);
    }

    @Override
    @Transactional
    public void removeDocumentFromClass(Long materialId, Long classroomId, String username) {
        User teacher = requireTeacher(username);
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học"));
        if (classroom.getTeacher() == null || !classroom.getTeacher().getId().equals(teacher.getId())) {
            throw new IllegalStateException("Bạn không có quyền thay đổi phân phối của lớp này");
        }

        Material material = materialRepository.findByIdAndTeacher_Id(materialId, teacher.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu"));
        MaterialAssignment assignment = assignmentRepository.findByMaterial_Id(materialId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phân phối tài liệu"));

        switch (assignment.getAssignmentType()) {
            case ALL -> {
                if (!excludedClassRepository.existsById_AssignmentIdAndId_ClassId(
                        assignment.getId(), classroomId)) {
                    excludedClassRepository.save(MaterialAssignmentExcludedClass.builder()
                            .id(new MaterialAssignmentExcludedClassId(assignment.getId(), classroomId))
                            .assignment(assignment)
                            .classroom(classroom)
                            .build());
                }
            }
            case CLASS -> {
                MaterialAssignmentClass target = assignmentClassRepository.findById(
                                new MaterialAssignmentClassId(assignment.getId(), classroomId))
                        .orElseThrow(() -> new IllegalArgumentException(
                                "Tài liệu này không được phân phối cho lớp"));
                assignmentClassRepository.delete(target);
                assignmentClassRepository.flush();
                if (assignmentClassRepository.findAllById_AssignmentIdIn(List.of(assignment.getId())).isEmpty()) {
                    assignmentRepository.delete(assignment);
                    assignmentRepository.flush();
                }
            }
            case STUDENT -> {
                List<MaterialAssignmentStudent> targets = assignmentStudentRepository
                        .findAllById_AssignmentIdAndClassroom_Id(assignment.getId(), classroomId);
                if (targets.isEmpty()) {
                    throw new IllegalArgumentException("Tài liệu này không được phân phối cho học sinh của lớp");
                }
                assignmentStudentRepository.deleteAll(targets);
                assignmentStudentRepository.flush();
                if (assignmentStudentRepository.findAllById_AssignmentIdIn(List.of(assignment.getId())).isEmpty()) {
                    assignmentRepository.delete(assignment);
                    assignmentRepository.flush();
                }
            }
        }
    }

    @Override
    @Transactional
    public List<MaterialDocumentResponse> getClassDocuments(Long classroomId, String username) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học"));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        if (user.getRole() == UserRole.TEACHER) {
            if (classroom.getTeacher() == null || !classroom.getTeacher().getId().equals(user.getId())) {
                throw new IllegalStateException("Bạn không có quyền xem tài liệu của lớp này");
            }
        } else if (user.getRole() != UserRole.STUDENT
                || !classStudentRepository.existsByClassroom_IdAndStudent_Username(classroomId, username)) {
            throw new IllegalStateException("Bạn không có quyền xem tài liệu của lớp này");
        }

        List<MaterialDocumentResponse> teacherDocuments = getDocumentsForTeacher(classroom.getTeacher().getId());
        Set<Long> studentsInClass = user.getRole() == UserRole.TEACHER
                ? new LinkedHashSet<>(classStudentRepository.findStudentIdsByClassroomId(classroomId))
                : Set.of(user.getId());

        return teacherDocuments.stream()
                .filter(document -> documentMapper.isVisibleInClass(
                        document, classroomId, studentsInClass, user.getRole()))
                .toList();
    }

    @Override
    @Transactional
    public void cleanupClassAssignments(Long classroomId) {
        assignmentManager.cleanupClassAssignments(classroomId);
    }

    @Override
    @Transactional
    public void cleanupStudentAssignments(Long studentId) {
        assignmentManager.cleanupStudentAssignments(studentId);
    }

    @Override
    @Transactional
    public void cleanupStudentAssignmentsForMembership(Long classroomId, Long studentId) {
        assignmentManager.cleanupStudentAssignmentsForMembership(classroomId, studentId);
    }

    @Override
    @Transactional
    public void cleanupStudentAssignmentsForClass(Long classroomId) {
        assignmentManager.cleanupStudentAssignmentsForClass(classroomId);
    }

    @Override
    @Transactional
    public void cleanupTeacherDocuments(Long teacherId) {
        List<Material> documents = materialRepository.findAllByTeacher_IdAndTypeOrderByCreatedAtDesc(
                teacherId, MaterialType.DOCUMENT);
        documents.forEach(this::deleteMaterialAndScheduleStorage);
        materialRepository.flush();
    }

    private User requireTeacher(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        if (user.getRole() != UserRole.TEACHER) {
            throw new IllegalStateException("Chỉ giáo viên mới được quản lý tài liệu");
        }
        return user;
    }

    private List<MaterialDocumentResponse> getDocumentsForTeacher(Long teacherId) {
        List<Material> materials = materialRepository.findAllByTeacher_IdAndTypeOrderByCreatedAtDesc(
                teacherId, MaterialType.DOCUMENT);
        return documentMapper.map(materials);
    }

    private void deleteMaterialAndScheduleStorage(Material material) {
        String objectPath = material.getFileUrl();
        materialRepository.delete(material);
        fileSupport.scheduleDelete(objectPath);
    }
}
