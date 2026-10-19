package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.exam.StudentExamResponse;
import com.classmanagement.backend.dto.publiclookup.PublicStudentLookupResponse;
import com.classmanagement.backend.entity.Attendance;
import com.classmanagement.backend.entity.Exam;
import com.classmanagement.backend.entity.ExamAttempt;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.AttendanceStatus;
import com.classmanagement.backend.entity.enums.ExamAttemptStatus;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.repository.AttendanceRepository;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import com.classmanagement.backend.repository.exam.ExamAttemptRepository;
import com.classmanagement.backend.repository.exam.StudentExamReadRepository;
import com.classmanagement.backend.repository.projection.ClassroomSummaryProjection;
import com.classmanagement.backend.service.PublicLookupService;
import com.classmanagement.backend.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
    private final ExamAttemptRepository examAttemptRepository;
    private final StudentExamReadRepository studentExamReadRepository;
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

        // 1. Lấy tất cả bản ghi điểm danh của học sinh
        List<Attendance> studentAttendances = attendanceRepository.findAllByStudent_Id(student.getId());

        // Gom nhóm điểm danh theo từng lớp học (key = classId)
        Map<Long, List<Attendance>> attendancesByClassId = studentAttendances.stream()
                .filter(a -> a.getClassroom() != null)
                .collect(Collectors.groupingBy(a -> a.getClassroom().getId()));

        // 2. Lấy tất cả bài thi/kết quả làm bài của học sinh
        List<ExamAttempt> attempts = examAttemptRepository.findAllByStudent_IdOrderByUpdatedAtDesc(student.getId());

        List<Long> assignmentIds = attempts.stream()
                .map(a -> a.getAssignment() != null ? a.getAssignment().getId() : null)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Map<Long, List<StudentExamResponse.ClassInfo>> classesByAssignment = assignmentIds.isEmpty()
                ? Collections.emptyMap()
                : studentExamReadRepository.findClasses(assignmentIds, student.getId());

        List<PublicStudentLookupResponse.PublicClassroomResponse> classrooms = summaries.stream()
                .map(c -> {
                    // Xử lý điểm danh (toàn bộ các buổi học đã được điểm danh: PRESENT, LATE, ABSENT)
                    List<Attendance> classAttendances = attendancesByClassId.getOrDefault(c.getId(), Collections.emptyList());

                    List<Attendance> sortedAttendances = classAttendances.stream()
                            .sorted(Comparator.comparing(Attendance::getDate, Comparator.nullsLast(Comparator.naturalOrder()))
                                    .thenComparing(Attendance::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                            .toList();

                    List<PublicStudentLookupResponse.PublicAbsenceDetail> absenceDetails = new ArrayList<>();
                    for (int i = 0; i < sortedAttendances.size(); i++) {
                        Attendance a = sortedAttendances.get(i);
                        String sessionName = (a.getLesson() != null && a.getLesson().getTitle() != null && !a.getLesson().getTitle().isBlank())
                                ? a.getLesson().getTitle()
                                : "Buổi " + (i + 1);

                        absenceDetails.add(PublicStudentLookupResponse.PublicAbsenceDetail.builder()
                                .sessionName(sessionName)
                                .date(a.getDate() != null ? a.getDate().format(DATE_FORMATTER) : "")
                                .status(a.getStatus() != null ? a.getStatus().name() : "")
                                .note(a.getNote())
                                .build());
                    }

                    int absentCount = (int) classAttendances.stream()
                            .filter(a -> a.getStatus() == AttendanceStatus.ABSENT)
                            .count();
                    int totalSessions = classAttendances.size();

                    // Xử lý kết quả điểm số các bài kiểm tra của lớp này
                    List<PublicStudentLookupResponse.PublicExamScoreResponse> examScores = attempts.stream()
                            .filter(a -> {
                                if (a.getAssignment() == null) return false;
                                Long aId = a.getAssignment().getId();
                                List<StudentExamResponse.ClassInfo> targetClasses = classesByAssignment.get(aId);
                                if (targetClasses != null && targetClasses.stream().anyMatch(cls -> cls.id().equals(c.getId()))) {
                                    return true;
                                }
                                if (c.getSubjectId() != null && a.getAssignment().getExam() != null && a.getAssignment().getExam().getSubject() != null) {
                                    return c.getSubjectId().equals(a.getAssignment().getExam().getSubject().getId());
                                }
                                return false;
                            })
                            .map(a -> {
                                Exam exam = a.getAssignment().getExam();
                                String examTitle = exam != null && exam.getTitle() != null ? exam.getTitle() : "Bài kiểm tra";
                                String examType = exam != null && exam.getSubject() != null ? exam.getSubject().getName()
                                        : (exam != null && exam.getPurpose() != null ? exam.getPurpose() : (c.getSubjectName() != null ? c.getSubjectName() : "Bài kiểm tra"));

                                LocalDateTime dateObj = a.getSubmittedAt() != null ? a.getSubmittedAt()
                                        : (a.getStartedAt() != null ? a.getStartedAt() : a.getCreatedAt());
                                String dateStr = dateObj != null ? dateObj.format(DATE_FORMATTER) : "";

                                Double scoreVal = a.getTotalScore() != null ? a.getTotalScore().doubleValue() : null;
                                Double maxScoreVal = exam != null && exam.getMaxScore() != null ? exam.getMaxScore().doubleValue() : 10.0;

                                String statusStr = "Đã chấm điểm";
                                if (a.getStatus() == ExamAttemptStatus.SUBMITTED) {
                                    statusStr = "Đã nộp bài (Chờ chấm)";
                                } else if (a.getStatus() == ExamAttemptStatus.IN_PROGRESS) {
                                    statusStr = "Đang làm bài";
                                } else if (a.getStatus() == ExamAttemptStatus.NOT_STARTED) {
                                    statusStr = "Chưa làm bài";
                                }

                                String comment = a.getTeacherComment() != null ? a.getTeacherComment() : "";

                                return PublicStudentLookupResponse.PublicExamScoreResponse.builder()
                                        .examTitle(examTitle)
                                        .examType(examType)
                                        .date(dateStr)
                                        .score(scoreVal)
                                        .maxScore(maxScoreVal)
                                        .status(statusStr)
                                        .teacherComment(comment)
                                        .build();
                            })
                            .toList();

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
                            .examScores(examScores)
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
                .avatar(student.getAvatar() != null && !student.getAvatar().isBlank()
                        ? storageService.getUrl(student.getAvatar()) : null)
                .classrooms(classrooms)
                .build();
    }
}
