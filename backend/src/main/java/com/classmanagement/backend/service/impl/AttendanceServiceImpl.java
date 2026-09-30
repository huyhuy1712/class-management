package com.classmanagement.backend.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.time.format.DateTimeFormatter;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.classmanagement.backend.dto.attendance.AttendanceResponse;
import com.classmanagement.backend.dto.attendance.AttendanceStudentRequest;
import com.classmanagement.backend.dto.attendance.CreateAttendanceRequest;
import com.classmanagement.backend.entity.Attendance;
import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.repository.AttendanceRepository;
import com.classmanagement.backend.repository.ClassStudentRepository;
import com.classmanagement.backend.repository.ClassroomRepository;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.service.AttendanceService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

        private static final DateTimeFormatter DISPLAY_DATE_FORMAT =
                        DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final AttendanceRepository attendanceRepository;
    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;
    private final ClassStudentRepository classStudentRepository;

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
                            .fullName(student.getFullName())
                            .date(saved.getDate())
                            .status(saved.getStatus())
                            .note(saved.getNote())
                            .build());
        }

        return responses;
    }
}