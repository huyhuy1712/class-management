package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.classroom.AddStudentToClassroomRequest;
import com.classmanagement.backend.dto.classroom.ClassroomResponse;
import com.classmanagement.backend.dto.classroom.ClassroomStudentResponse;
import com.classmanagement.backend.dto.classroom.CreateClassroomRequest;
import com.classmanagement.backend.dto.classroom.ImportStudentErrorResponse;
import com.classmanagement.backend.dto.classroom.ImportStudentsResponse;
import com.classmanagement.backend.dto.classroom.UpdateClassroomRequest;
import com.classmanagement.backend.entity.ClassStudent;
import com.classmanagement.backend.entity.ClassStudentId;
import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.entity.Subject;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.ClassroomStatus;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.repository.ClassStudentRepository;
import com.classmanagement.backend.repository.ClassroomRepository;
import com.classmanagement.backend.repository.SubjectRepository;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.service.ClassroomService;
import com.classmanagement.backend.service.StorageService;
import com.classmanagement.backend.service.excel.StudentExcelReader;

import com.classmanagement.backend.exception.ConflictException;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


import org.apache.poi.ss.usermodel.*;

@Service
@RequiredArgsConstructor
public class ClassroomServiceImpl implements ClassroomService {

    private final ClassroomRepository classroomRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final ClassStudentRepository classStudentRepository;
    private final StorageService storageService;
    private final StudentExcelReader studentExcelReader;

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
public ClassroomResponse updateClass( Long id, UpdateClassroomRequest request) {

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
@Transactional
public ClassroomResponse activateClassroom(Long id) {
        Classroom classroom = classroomRepository
                        .findById(id)
                        .orElseThrow(() -> new IllegalArgumentException(
                                        "Không tìm thấy lớp học"));

        if (classroom.getStatus() != ClassroomStatus.ACTIVE) {
                classroom.setStatus(ClassroomStatus.ACTIVE);
                classroom = classroomRepository.save(classroom);
        }

        return toResponse(classroom);
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

@Override
@Transactional
public ClassroomStudentResponse addStudent(
                Long classroomId,
                AddStudentToClassroomRequest request
        ) {

        Classroom classroom = classroomRepository
                .findById(classroomId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Không tìm thấy lớp học"
                        )
                );

        User student = userRepository
                .findById(request.getStudentId())
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Không tìm thấy học sinh"
                        )
                );

        if (student.getRole() != UserRole.STUDENT) {
                throw new IllegalArgumentException(
                        "Người dùng được chọn không phải là học sinh"
                );
        }

        if (student.getStatus() != UserStatus.ACTIVE) {
                throw new IllegalArgumentException(
                        "Tài khoản học sinh chưa được kích hoạt"
                );
        }

        if (classStudentRepository
                        .existsByClassroomIdAndStudentId(
                                        classroomId,
                                        student.getId())) {

                throw new ConflictException(
                                "Học sinh đã có trong lớp học này");
        }

        LocalDateTime joinedAt = LocalDateTime.now();

        ClassStudent classStudent = ClassStudent.builder()
                .classroom(classroom)
                .student(student)
                .joinedAt(joinedAt)
                .build();

        classStudentRepository.save(classStudent);

        return ClassroomStudentResponse.builder()
                .id(student.getId())
                .studentCode(student.getStudentCode())
                .username(student.getUsername())
                .fullName(student.getFullName())
                .email(student.getEmail())
                .phone(student.getPhone())
                .avatar(
                        student.getAvatar() != null && !student.getAvatar().isBlank()
                        ? storageService.getUrl(student.getAvatar())
                        : null)                
                .joinedAt(joinedAt)
                .build();
         }
         
@Transactional(readOnly = true)
@Override
public List<ClassroomStudentResponse> getStudentsByClassroomId(
                         Long classroomId) {
                 if (!classroomRepository.existsById(classroomId)) {
                         throw new IllegalArgumentException(
                                         "Không tìm thấy lớp học");
                 }

                 return classStudentRepository
                        .findAllByClassroomId(classroomId)
                        .stream()
                        .map(classStudent -> {

                                User student = classStudent.getStudent();

                return ClassroomStudentResponse.builder()
                        .id(student.getId())
                        .studentCode(student.getStudentCode())
                        .username(student.getUsername())
                        .fullName(student.getFullName())
                        .email(student.getEmail())
                        .phone(student.getPhone())
                        .avatar(storageService.getUrl(student.getAvatar()))
                        .joinedAt(classStudent.getJoinedAt())
                        .build();
        })
                        .toList();
         }
        
@Transactional
@Override
public void removeStudentFromClassroom(
                Long classroomId,
                Long studentId
        ) {

        if (!classroomRepository.existsById(classroomId)) {
                throw new IllegalArgumentException(
                        "Không tìm thấy lớp học"
                );
        }

        if (!userRepository.existsById(studentId)) {
                throw new IllegalArgumentException(
                        "Không tìm thấy học sinh"
                );
        }

        ClassStudentId classStudentId =
                new ClassStudentId(
                        classroomId,
                        studentId
                );

        if (!classStudentRepository.existsById(classStudentId)) {
                throw new IllegalArgumentException(
                        "Học sinh không thuộc lớp học này"
                );
        }

        classStudentRepository.deleteById(classStudentId);
}

@Override
@Transactional(readOnly = true)
public List<ClassroomResponse> getMyClassrooms(String username) {

        User teacher = userRepository.findByUsername(username)
                        .orElseThrow(() -> new IllegalArgumentException(
                                        "Không tìm thấy người dùng"));

        if (teacher.getRole() != UserRole.TEACHER) {
                throw new IllegalStateException(
                                "Chỉ giáo viên mới được xem danh sách lớp của mình");
        }

        List<Classroom> classrooms = classroomRepository.findAllByTeacher_Id(
                        teacher.getId());

        return classrooms.stream()
                        .map(this::toResponse)
                        .toList();
}


private Classroom getClassroomById(Long classroomId) {
        return classroomRepository
                        .findById(classroomId)
                        .orElseThrow(() -> new IllegalArgumentException(
                                        "Không tìm thấy lớp học"));
}


@Override
@Transactional
public ImportStudentsResponse importStudents( Long classroomId, MultipartFile file) {
        Classroom classroom = getClassroomById(classroomId);

        studentExcelReader.validateFile(file);

        List<ImportStudentErrorResponse> errors = new ArrayList<>();
        int[] result = { 0, 0 };

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {

                Sheet sheet = workbook.getSheetAt(0);

                studentExcelReader.validateHeader(sheet);

                for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                        processImportRow(
                                        sheet.getRow(i),
                                        i + 1,
                                        classroom,
                                        errors,
                                        result);
                }

        } catch (IOException e) {
                throw new IllegalArgumentException(
                                "Không thể đọc file Excel");
        }

        return ImportStudentsResponse.builder()
                        .total(result[0])
                        .success(result[1])
                        .failed(errors.size())
                        .errors(errors)
                        .build();
}

private void processImportRow(
                Row row,
                int rowNumber,
                Classroom classroom,
                List<ImportStudentErrorResponse> errors,
                int[] result) {
        if (studentExcelReader.isRowEmpty(row)) {
                return;
        }

        result[0]++;

        String studentCode = studentExcelReader.getStudentCode(row);

        if (studentCode.isBlank()) {
                errors.add(
                                ImportStudentErrorResponse.builder()
                                                .row(rowNumber)
                                                .studentCode("")
                                                .message("Mã học sinh không được để trống")
                                                .build());
                return;
        }

        try {
                importStudent(classroom, studentCode);
                result[1]++;

        } catch (IllegalArgumentException | ConflictException e) {
                errors.add(
                                ImportStudentErrorResponse.builder()
                                                .row(rowNumber)
                                                .studentCode(studentCode)
                                                .message(e.getMessage())
                                                .build());
        }
}

private void importStudent(
                Classroom classroom,
                String studentCode) {
        User student = userRepository
                        .findByStudentCode(studentCode.trim())
                        .orElseThrow(() -> new IllegalArgumentException(
                                        "Không tìm thấy học sinh với mã "
                                                        + studentCode));

        AddStudentToClassroomRequest request = new AddStudentToClassroomRequest();

        request.setStudentId(student.getId());

        addStudent(
                        classroom.getId(),
                        request);
}

}