package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.classroom.ClassroomResponse;
import com.classmanagement.backend.dto.classroom.CreateClassroomRequest;
import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.entity.Subject;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.ClassStatus;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.repository.ClassroomRepository;
import com.classmanagement.backend.repository.SubjectRepository;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.service.ClassroomService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClassroomServiceImpl implements ClassroomService {

    private final ClassroomRepository classroomRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ClassroomResponse createClassroom(CreateClassroomRequest request) {

        if (classroomRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Class code already exists");
        }

        Subject subject = subjectRepository
                .findById(request.getSubjectId())
                .orElseThrow(() ->
                        new IllegalArgumentException("Subject not found"));

        User teacher = userRepository
                .findById(request.getTeacherId())
                .orElseThrow(() ->
                        new IllegalArgumentException("Teacher not found"));

        if (teacher.getRole() != UserRole.TEACHER) {
            throw new IllegalArgumentException(
                    "Selected user is not a teacher"
            );
        }

        Classroom classroom = Classroom.builder()
                .name(request.getName())
                .code(request.getCode())
                .subject(subject)
                .teacher(teacher)
                .academicYear(request.getAcademicYear())
                .description(request.getDescription())
                .status(ClassStatus.ACTIVE)
                .build();

        Classroom saved =
                classroomRepository.save(classroom);

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassroomResponse> getAllClassrooms() {

        return classroomRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private ClassroomResponse toResponse(Classroom classroom) {

        return ClassroomResponse.builder()
                .id(classroom.getId())
                .name(classroom.getName())
                .code(classroom.getCode())
                .subjectId(classroom.getSubject().getId())
                .subjectName(classroom.getSubject().getName())
                .teacherId(classroom.getTeacher().getId())
                .teacherName(classroom.getTeacher().getFullName())
                .academicYear(classroom.getAcademicYear())
                .description(classroom.getDescription())
                .status(classroom.getStatus())
                .createdAt(classroom.getCreatedAt())
                .updatedAt(classroom.getUpdatedAt())
                .build();
    }
}