package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.classroom.ClassroomResponse;
import com.classmanagement.backend.dto.classroom.CreateClassroomRequest;
import com.classmanagement.backend.dto.classroom.UpdateClassroomRequest;
import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.entity.Subject;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.ClassroomStatus;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
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
            throw new IllegalArgumentException("Mã lớp đã tồn tại");
        }

        Subject subject = subjectRepository
                .findById(request.getSubjectId())
                .orElseThrow(() ->
                        new IllegalArgumentException("Không tìm thấy môn học"));

        User teacher = userRepository
                .findById(request.getTeacherId())
                .orElseThrow(() ->
                        new IllegalArgumentException("Không tìm thấy giáo viên"));

        if (teacher.getRole() != UserRole.TEACHER) {
            throw new IllegalArgumentException(
                    "Người dùng được chọn không phải là giáo viên"
            );
        }

        Classroom classroom = Classroom.builder()
                .name(request.getName())
                .code(request.getCode())
                .subject(subject)
                .teacher(teacher)
                .academicYear(request.getAcademicYear())
                .description(request.getDescription())
                .status(ClassroomStatus.ACTIVE)
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

        @Override
        public ClassroomResponse updateClass(
        Long id,
        UpdateClassroomRequest request
        ) {

    // 1. Tìm class
    Classroom classroom = classroomRepository
            .findById(id)
            .orElseThrow(() ->
                    new IllegalArgumentException(
                            "Không tìm thấy lớp học"
                    )
            );


    // 2. Check class code
    // Chỉ check nếu code thực sự thay đổi
    if (!classroom.getCode().equals(request.getCode())
            && classroomRepository.existsByCode(request.getCode())) {

        throw new IllegalArgumentException(
                "Mã lớp đã tồn tại"
        );
    }


    // 3. Tìm subject
    Subject subject = subjectRepository
            .findById(request.getSubjectId())
            .orElseThrow(() ->
                    new IllegalArgumentException(
                            "Không tìm thấy môn học"
                    )
            );


    // 4. Tìm teacher
    User teacher = userRepository
            .findById(request.getTeacherId())
            .orElseThrow(() ->
                    new IllegalArgumentException(
                            "Không tìm thấy giáo viên"
                    )
            );


    // 5. User được chọn phải thực sự là TEACHER
    if (teacher.getRole() != UserRole.TEACHER) {
        throw new IllegalArgumentException(
                "Người dùng được chọn không phải là giáo viên"
        );
    }


    // 6. Teacher phải ACTIVE
    if (teacher.getStatus() != UserStatus.ACTIVE) {
        throw new IllegalArgumentException(
                "Tài khoản giáo viên chưa được kích hoạt"
        );
    }


    // 7. Update
    classroom.setName(request.getName());
    classroom.setCode(request.getCode());
    classroom.setSubject(subject);
    classroom.setTeacher(teacher);
    classroom.setAcademicYear(request.getAcademicYear());
    classroom.setDescription(request.getDescription());


    // 8. Save
    Classroom savedClass =
            classroomRepository.save(classroom);


    // 9. Entity -> Response
    return ClassroomResponse.builder()
            .id(savedClass.getId())
            .name(savedClass.getName())
            .code(savedClass.getCode())
            .subjectId(savedClass.getSubject().getId())
            .teacherId(savedClass.getTeacher().getId())
            .academicYear(savedClass.getAcademicYear())
            .description(savedClass.getDescription())
            .status(savedClass.getStatus())
            .build();
}

        @Override
        public ClassroomResponse archiveClassroom(Long id) {

    // 1. Tìm classroom
    Classroom classroom = classroomRepository
            .findById(id)
            .orElseThrow(() ->
                    new IllegalArgumentException(
                            "Không tìm thấy lớp học"
                    )
            );

    // 2. Nếu đã archive rồi thì không cần archive lại
    if (classroom.getStatus() == ClassroomStatus.ARCHIVED) {
        throw new IllegalStateException(
                "Lớp học đã bị vô hiệu hóa trước đó"
        );
    }

    // 3. Soft delete = chỉ đổi status
    classroom.setStatus(ClassroomStatus.ARCHIVED);

    // 4. Save
    Classroom savedClassroom =
            classroomRepository.save(classroom);

    // 5. Response
    return ClassroomResponse.builder()
            .id(savedClassroom.getId())
            .name(savedClassroom.getName())
            .code(savedClassroom.getCode())
            .subjectId(savedClassroom.getSubject().getId())
            .teacherId(savedClassroom.getTeacher().getId())
            .academicYear(savedClassroom.getAcademicYear())
            .description(savedClassroom.getDescription())
            .status(savedClassroom.getStatus())
            .build();
}

        @Override
        public void deleteClassroom(Long id) {

        // 1. Tìm classroom
        Classroom classroom = classroomRepository
                .findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Không tìm thấy lớp học"
                        )
                );

        // 2. Xóa thật
        classroomRepository.delete(classroom);
        }
}