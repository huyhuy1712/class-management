package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.publiclookup.PublicStudentLookupResponse;
import com.classmanagement.backend.entity.Attendance;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.AttendanceStatus;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.repository.AttendanceRepository;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import com.classmanagement.backend.repository.projection.ClassroomSummaryProjection;
import com.classmanagement.backend.service.PublicLookupService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PublicLookupServiceImpl implements PublicLookupService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final UserRepository userRepository;
    private final ClassStudentRepository classStudentRepository;
    private final AttendanceRepository attendanceRepository;

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

        // Lấy tất cả bản ghi điểm danh của học sinh
        List<Attendance> studentAttendances = attendanceRepository.findAllByStudent_Id(student.getId());

        // Gom nhóm điểm danh theo từng lớp học (key = classId)
        Map<Long, List<Attendance>> attendancesByClassId = studentAttendances.stream()
                .filter(a -> a.getClassroom() != null)
                .collect(Collectors.groupingBy(a -> a.getClassroom().getId()));

        List<PublicStudentLookupResponse.PublicClassroomResponse> classrooms = summaries.stream()
                .map(c -> {
                    List<Attendance> classAttendances = attendancesByClassId.getOrDefault(c.getId(), Collections.emptyList());

                    // Lọc các buổi vắng mặt hoặc đi trễ (khác PRESENT)
                    List<PublicStudentLookupResponse.PublicAbsenceDetail> absenceDetails = classAttendances.stream()
                            .filter(a -> a.getStatus() != AttendanceStatus.PRESENT)
                            .sorted(Comparator.comparing(Attendance::getDate, Comparator.nullsLast(Comparator.reverseOrder())))
                            .map(a -> PublicStudentLookupResponse.PublicAbsenceDetail.builder()
                                    .date(a.getDate() != null ? a.getDate().format(DATE_FORMATTER) : "")
                                    .status(a.getStatus() != null ? a.getStatus().name() : "")
                                    .note(a.getNote())
                                    .build())
                            .toList();

                    int absentCount = absenceDetails.size();
                    int totalSessions = classAttendances.size();

                    return PublicStudentLookupResponse.PublicClassroomResponse.builder()
                            .classId(c.getId())
                            .classCode(c.getCode())
                            .className(c.getName())
                            .subjectName(c.getSubjectName())
                            .teacherName(c.getTeacherName())
                            .academicYear(c.getAcademicYear())
                            .description(c.getDescription())
                            .status(c.getStatus() != null ? c.getStatus().name() : null)
                            .absentCount(absentCount)
                            .totalSessions(totalSessions)
                            .absenceDetails(absenceDetails)
                            .build();
                })
                .toList();

        return PublicStudentLookupResponse.builder()
                .id(student.getId())
                .studentCode(student.getStudentCode() != null && !student.getStudentCode().isBlank()
                        ? student.getStudentCode() : student.getUsername())
                .fullName(student.getFullName())
                .email(student.getEmail())
                .phone(student.getPhone())
                .avatar(student.getAvatar())
                .classrooms(classrooms)
                .build();
    }
}
