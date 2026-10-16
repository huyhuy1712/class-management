package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.publiclookup.PublicStudentLookupResponse;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import com.classmanagement.backend.repository.projection.ClassroomSummaryProjection;
import com.classmanagement.backend.service.PublicLookupService;
import com.classmanagement.backend.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PublicLookupServiceImpl implements PublicLookupService {

    private final UserRepository userRepository;
    private final ClassStudentRepository classStudentRepository;
    private final StorageService storageService;

    @Override
    @Transactional(readOnly = true)
    public PublicStudentLookupResponse lookupStudentByCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            throw new IllegalArgumentException("Mã học sinh không được để trống");
        }

        String cleanCode = code.trim();

        User student = userRepository.findByStudentCodeIgnoreCase(cleanCode)
                .or(() -> userRepository.findByUsername(cleanCode))
                .filter(u -> u.getRole() == UserRole.STUDENT)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học sinh với mã đã cung cấp"));

        List<ClassroomSummaryProjection> summaries = classStudentRepository.findClassSummariesByStudentId(student.getId());

        List<PublicStudentLookupResponse.PublicClassroomResponse> classrooms = summaries.stream()
                .map(c -> PublicStudentLookupResponse.PublicClassroomResponse.builder()
                        .classId(c.getId())
                        .classCode(c.getCode())
                        .className(c.getName())
                        .subjectName(c.getSubjectName())
                        .teacherName(c.getTeacherName())
                        .academicYear(c.getAcademicYear())
                        .description(c.getDescription())
                        .status(c.getStatus() != null ? c.getStatus().name() : null)
                        .build())
                .toList();

        return PublicStudentLookupResponse.builder()
                .id(student.getId())
                .studentCode(student.getStudentCode() != null && !student.getStudentCode().isBlank()
                        ? student.getStudentCode() : student.getUsername())
                .fullName(student.getFullName())
                .email(student.getEmail())
                .phone(student.getPhone())
                .avatar(student.getAvatar() != null && !student.getAvatar().isBlank()
                        ? storageService.getUrl(student.getAvatar()) : null)
                .classrooms(classrooms)
                .build();
    }
}

