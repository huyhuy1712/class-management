package com.classmanagement.backend.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.classmanagement.backend.dto.attendance.AttendanceExportRow;
import com.classmanagement.backend.dto.attendance.AttendanceExportRow.AttendanceExportResult;
import com.classmanagement.backend.dto.attendance.AttendanceResponse;
import com.classmanagement.backend.dto.attendance.AttendanceStudentRequest;
import com.classmanagement.backend.dto.attendance.CreateAttendanceRequest;
import com.classmanagement.backend.dto.attendance.UpdateAttendanceRequest;
import com.classmanagement.backend.entity.Attendance;
import com.classmanagement.backend.entity.ClassStudent;
import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.AttendanceStatus;
import com.classmanagement.backend.repository.AttendanceRepository;
import com.classmanagement.backend.repository.ClassStudentRepository;
import com.classmanagement.backend.repository.ClassroomRepository;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.service.AttendanceService;
import com.classmanagement.backend.service.StorageService;
import com.classmanagement.backend.service.excel.AttendanceExcelExporter;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private static final DateTimeFormatter DISPLAY_DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final AttendanceRepository attendanceRepository;
    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;
    private final ClassStudentRepository classStudentRepository;
    private final StorageService storageService;
    private final AttendanceExcelExporter attendanceExcelExporter;

private String getStudentAvatarUrl(User student) {
                        String avatar = student.getAvatar();
                        return avatar == null || avatar.isBlank()
                                                        ? null
                                                        : storageService.getUrl(avatar);
        }

private AttendanceResponse toResponse(Attendance attendance) {
            User student = attendance.getStudent();

            return AttendanceResponse.builder()
                            .id(attendance.getId())
                            .studentId(student.getId())
                            .studentCode(student.getStudentCode())
                            .studentAvatar(getStudentAvatarUrl(student))
                            .fullName(student.getFullName())
                            .date(attendance.getDate())
                            .status(attendance.getStatus())
                            .note(attendance.getNote())
                            .build();
    }

@Transactional
@Override
public List<AttendanceResponse> createAttendance(
            Long classroomId,
            CreateAttendanceRequest request) {

        Classroom classroom = classroomRepository
                .findById(classroomId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy lớp học"));

        List<AttendanceResponse> responses = new ArrayList<>();

        for (AttendanceStudentRequest item : request.getStudents()) {

            User student = userRepository
                    .findById(item.getStudentId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Không tìm thấy học sinh có ID: "
                                    + item.getStudentId()));

            boolean belongsToClass = classStudentRepository
                    .existsByClassroomIdAndStudentId(
                            classroomId,
                            student.getId());

            if (!belongsToClass) {
                throw new IllegalArgumentException(
                        "Học sinh "
                                + student.getFullName()
                                + " không thuộc lớp học này");
            }

            boolean attendanceExists = attendanceRepository
                    .existsByClassroom_IdAndStudent_IdAndDate(
                            classroomId,
                            student.getId(),
                            request.getDate());

            if (attendanceExists) {
                throw new IllegalArgumentException(
                        "Học sinh "
                                + student.getFullName()
                                + " đã được điểm danh trong ngày "
                                + request.getDate().format(DISPLAY_DATE_FORMAT));
            }

            Attendance attendance = Attendance.builder()
                    .classroom(classroom)
                    .student(student)
                    .date(request.getDate())
                    .status(item.getStatus())
                    .note(item.getNote())
                    .build();

            Attendance saved;

            try {
                saved = attendanceRepository.saveAndFlush(attendance);
            } catch (DataIntegrityViolationException exception) {
                throw new IllegalArgumentException(
                        "Học sinh "
                                + student.getFullName()
                                + " đã được điểm danh trong ngày "
                                + request.getDate().format(DISPLAY_DATE_FORMAT),
                        exception);
            }

            responses.add(
                    AttendanceResponse.builder()
                            .id(saved.getId())
                            .studentId(student.getId())
                            .studentCode(student.getStudentCode())
                            .studentAvatar(getStudentAvatarUrl(student))
                            .fullName(student.getFullName())
                            .date(saved.getDate())
                            .status(saved.getStatus())
                            .note(saved.getNote())
                            .build());
        }

        return responses;
    }

@Override
@Transactional(readOnly = true)
public List<AttendanceResponse> getAttendancesByClassroom(
                    Long classroomId) {

            if (!classroomRepository.existsById(classroomId)) {
                    throw new IllegalArgumentException(
                                    "Không tìm thấy lớp học");
            }

            return attendanceRepository
                            .findAllByClassroom_IdOrderByDateDesc(classroomId)
                            .stream()
                            .map(this::toResponse)
                            .toList();
    }

@Override
@Transactional
public void deleteAttendance(
        Long classroomId,
        Long studentId,
        LocalDate date
) {
    long deletedCount =
            attendanceRepository
                    .deleteByClassroom_IdAndStudent_IdAndDate(
                            classroomId,
                            studentId,
                            date
                    );

    if (deletedCount == 0) {
        throw new IllegalArgumentException(
                "Không tìm thấy dữ liệu điểm danh của học sinh trong ngày này"
        );
    }
}

@Override
@Transactional
public AttendanceResponse updateAttendance(
                Long classroomId,
                Long attendanceId,
                UpdateAttendanceRequest request) {
        Attendance attendance = attendanceRepository
                        .findById(attendanceId)
                        .orElseThrow(() -> new IllegalArgumentException(
                                        "Không tìm thấy dữ liệu điểm danh"));

        if (!attendance.getClassroom().getId().equals(classroomId)) {
                throw new IllegalArgumentException(
                                "Dữ liệu điểm danh không thuộc lớp học này");
        }

        // Nếu có thay đổi ngày thì kiểm tra trùng
        if (request.getDate() != null) {

                Long studentId = attendance.getStudent().getId();

                boolean duplicate = attendanceRepository
                                .existsByClassroom_IdAndStudent_IdAndDateAndIdNot(
                                                classroomId,
                                                studentId,
                                                request.getDate(),
                                                attendanceId);

                if (duplicate) {
                        throw new IllegalArgumentException(
                                        "Học sinh đã có dữ liệu điểm danh trong ngày này");
                }

                attendance.setDate(request.getDate());
        }

        if (request.getStatus() != null) {
                attendance.setStatus(request.getStatus());
        }

        if (request.getNote() != null) {
                attendance.setNote(request.getNote());
        }

        attendance = attendanceRepository.save(attendance);

        return toResponse(attendance);
}
   
@Override
@Transactional(readOnly = true)
public AttendanceExportResult exportAttendance(
        Long classroomId,
        LocalDate date
) {
    Classroom classroom = classroomRepository
            .findById(classroomId)
            .orElseThrow(() ->
                    new IllegalArgumentException(
                            "Không tìm thấy lớp học"
                    )
            );

    List<ClassStudent> classStudents =
            classStudentRepository
                    .findAllByClassroomId(classroomId);

    List<Attendance> attendances =
            attendanceRepository
                    .findAllByClassroomIdAndDate(
                            classroomId,
                            date
                    );

    Map<Long, Attendance> attendanceMap =
            createAttendanceMap(attendances);

    List<AttendanceExportRow> rows =
            createExportRows(
                    classStudents,
                    attendanceMap
            );

    byte[] file =
            attendanceExcelExporter.export(rows);

    return new AttendanceExportResult(
            file,
            classroom.getName()
    );
}

// hepler
private Map<Long, Attendance> createAttendanceMap(
        List<Attendance> attendances) {
        return attendances.stream()
        .collect(Collectors.toMap(
                        attendance -> attendance.getStudent().getId(),
                        attendance -> attendance));
}

private List<AttendanceExportRow> createExportRows(
                List<ClassStudent> classStudents,
                Map<Long, Attendance> attendanceMap) {
                return classStudents.stream()
        .map(classStudent -> {

        User student = classStudent.getStudent();

        Attendance attendance = attendanceMap.get(student.getId());

        AttendanceStatus status = attendance != null
                        ? attendance.getStatus()
                        : AttendanceStatus.ABSENT;

        String reason = attendance != null
                        ? attendance.getNote()
                        : "";

        return AttendanceExportRow.builder()
                        .studentCode(student.getStudentCode())
                        .fullName(student.getFullName())
                        .status(status)
                        .reason(reason)
                        .build();
                        })
                        .toList();
}

}