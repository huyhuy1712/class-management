package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.material.MaterialDocumentResponse;
import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.entity.Material;
import com.classmanagement.backend.entity.enums.MaterialType;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.repository.MaterialRepository;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.classroom.ClassroomRepository;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import com.classmanagement.backend.service.MaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MaterialServiceImpl implements MaterialService {
    private final MaterialRepository materialRepository;
    private final ClassroomRepository classroomRepository;
    private final ClassStudentRepository classStudentRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MaterialDocumentResponse> getClassDocuments(Long classroomId, String username) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lớp học"));
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));

        if (user.getRole() == UserRole.TEACHER) {
            if (classroom.getTeacher() == null
                    || !username.equals(classroom.getTeacher().getUsername())) {
                throw new IllegalStateException("Bạn không có quyền xem tài liệu của lớp này");
            }
        } else if (user.getRole() != UserRole.STUDENT
                || !classStudentRepository.existsByClassroom_IdAndStudent_Username(classroomId, username)) {
            throw new IllegalStateException("Bạn không có quyền xem tài liệu của lớp này");
        }

        return materialRepository
                .findAllByClassroom_IdAndTypeOrderByCreatedAtDesc(classroomId, MaterialType.DOCUMENT)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private MaterialDocumentResponse toResponse(Material material) {
        return MaterialDocumentResponse.builder()
                .id(material.getId())
                .title(material.getTitle())
                .content(material.getContent())
                .fileUrl(material.getFileUrl())
                .createdAt(material.getCreatedAt())
                .build();
    }
}
