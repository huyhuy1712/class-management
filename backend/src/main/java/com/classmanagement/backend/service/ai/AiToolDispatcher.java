package com.classmanagement.backend.service.ai;

import com.classmanagement.backend.dto.exam.StudentExamResponse;
import com.classmanagement.backend.dto.exam.StudentGradesResponse;
import com.classmanagement.backend.dto.homework.HomeworkDtos;
import com.classmanagement.backend.entity.Attendance;
import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.entity.Exam;
import com.classmanagement.backend.entity.ExamAssignment;
import com.classmanagement.backend.entity.Lesson;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.AttendanceStatus;
import com.classmanagement.backend.repository.AttendanceRepository;
import com.classmanagement.backend.repository.LessonRepository;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import com.classmanagement.backend.repository.classroom.ClassroomRepository;
import com.classmanagement.backend.repository.exam.ExamAssignmentRepository;
import com.classmanagement.backend.repository.exam.ExamRepository;
import com.classmanagement.backend.repository.projection.ClassroomSummaryProjection;
import com.classmanagement.backend.service.exam.StudentExamReadService;
import com.classmanagement.backend.service.homework.queries.HomeworkReadService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
public class AiToolDispatcher {

    private final ClassroomRepository classroomRepository;
    private final ClassStudentRepository classStudentRepository;
    private final LessonRepository lessonRepository;
    private final ExamRepository examRepository;
    private final ExamAssignmentRepository examAssignmentRepository;
    private final StudentExamReadService studentExamReadService;
    private final AttendanceRepository attendanceRepository;
    private final HomeworkReadService homeworkReadService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Autowired
    public AiToolDispatcher(ClassroomRepository classroomRepository,
                            ClassStudentRepository classStudentRepository,
                            LessonRepository lessonRepository,
                            ExamRepository examRepository,
                            ExamAssignmentRepository examAssignmentRepository,
                            StudentExamReadService studentExamReadService,
                            AttendanceRepository attendanceRepository,
                            HomeworkReadService homeworkReadService) {
        this.classroomRepository = classroomRepository;
        this.classStudentRepository = classStudentRepository;
        this.lessonRepository = lessonRepository;
        this.examRepository = examRepository;
        this.examAssignmentRepository = examAssignmentRepository;
        this.studentExamReadService = studentExamReadService;
        this.attendanceRepository = attendanceRepository;
        this.homeworkReadService = homeworkReadService;
    }

    public AiToolDispatcher(ClassroomRepository classroomRepository,
                            ClassStudentRepository classStudentRepository,
                            LessonRepository lessonRepository,
                            ExamRepository examRepository,
                            ExamAssignmentRepository examAssignmentRepository,
                            StudentExamReadService studentExamReadService) {
        this(classroomRepository, classStudentRepository, lessonRepository,
                examRepository, examAssignmentRepository, studentExamReadService,
                null, null);
    }

    public AiToolDispatcher(ClassroomRepository classroomRepository,
                            ClassStudentRepository classStudentRepository,
                            LessonRepository lessonRepository) {
        this(classroomRepository, classStudentRepository, lessonRepository, null, null, null, null, null);
    }

    /**
     * Trả về danh sách schema công cụ phù hợp với vai trò của người dùng
     */
    public List<Map<String, Object>> getToolsForRole(String role) {
        List<Map<String, Object>> tools = new ArrayList<>();
        if ("TEACHER".equalsIgnoreCase(role)) {
            tools.add(buildToolSchema(
                    "getTeacherClasses",
                    "Lấy danh sách các lớp học mà giáo viên đang phụ trách giảng dạy trên hệ thống FrogH kèm đường dẫn chi tiết.",
                    Map.of()
            ));
            tools.add(buildToolSchema(
                    "getTeacherTodaySchedule",
                    "Lấy lịch dạy hoặc danh sách các tiết học trong ngày hôm nay của giáo viên kèm đường dẫn vào lớp.",
                    Map.of()
            ));
            tools.add(buildToolSchema(
                    "getTeacherExams",
                    "Lấy danh sách các đề thi mà giáo viên đã tạo trong ngân hàng đề thi FrogH (tiêu đề, môn học, mã đề, thời gian làm bài, trạng thái) kèm đường dẫn chi tiết đề thi.",
                    Map.of()
            ));
            tools.add(buildToolSchema(
                    "getTeacherAssignments",
                    "Lấy danh sách các đợt thi hoặc bài kiểm tra mà giáo viên đã giao cho các lớp học (thời gian mở/đóng, trạng thái) kèm đường dẫn quản lý bài kiểm tra.",
                    Map.of()
            ));

            Map<String, Object> openAttendanceProps = new HashMap<>();
            openAttendanceProps.put("classId", buildProperty("integer", "ID của lớp học muốn mở phiên điểm danh (tùy chọn nếu giáo viên chỉ dạy 1 lớp)"));
            openAttendanceProps.put("durationMinutes", buildProperty("integer", "Thời lượng mở điểm danh tính theo phút (mặc định 15 phút)"));
            tools.add(buildToolSchema(
                    "openQuickAttendanceSession",
                    "Mở phiên điểm danh nhanh cho lớp học, tự động sinh mã OTP điểm danh và thiết lập thời gian cho học sinh điểm danh kèm đường dẫn trực tiếp.",
                    openAttendanceProps
            ));

            Map<String, Object> classAttendanceProps = new HashMap<>();
            classAttendanceProps.put("classId", buildProperty("integer", "ID của lớp học cần xem tình hình điểm danh (tùy chọn)"));
            classAttendanceProps.put("date", buildProperty("string", "Ngày cần xem điểm danh định dạng YYYY-MM-DD (tùy chọn, mặc định hôm nay)"));
            tools.add(buildToolSchema(
                    "getTeacherClassAttendance",
                    "Xem danh sách và thống kê tình hình điểm danh (có mặt, đi muộn, vắng mặt) của học sinh trong lớp học kèm mã điểm danh buổi học và đường dẫn quản lý.",
                    classAttendanceProps
            ));

            Map<String, Object> teacherHomeworkProps = new HashMap<>();
            teacherHomeworkProps.put("classId", buildProperty("integer", "ID của lớp học cần lọc bài tập đã giao (tùy chọn)"));
            tools.add(buildToolSchema(
                    "getTeacherHomeworks",
                    "Lấy danh sách các bài tập về nhà mà giáo viên đã giao cho học sinh kèm thống kê số lượng nộp bài, số bài đã chấm và đường dẫn quản lý.",
                    teacherHomeworkProps
            ));
        } else if ("STUDENT".equalsIgnoreCase(role)) {
            tools.add(buildToolSchema(
                    "getStudentClasses",
                    "Lấy danh sách các lớp học mà học sinh đang tham gia học tập trên hệ thống FrogH kèm đường dẫn vào lớp.",
                    Map.of()
            ));
            tools.add(buildToolSchema(
                    "getStudentExams",
                    "Lấy danh sách các bài thi hoặc bài kiểm tra được giao cho học sinh (chưa làm, đang mở, sắp đóng) kèm đường dẫn vào làm bài.",
                    Map.of()
            ));
            tools.add(buildToolSchema(
                    "getStudentGrades",
                    "Lấy kết quả điểm số các bài kiểm tra học sinh đã nộp và được chấm điểm trên hệ thống kèm đường dẫn xem chi tiết kết quả.",
                    Map.of()
            ));

            Map<String, Object> studentAttendanceProps = new HashMap<>();
            studentAttendanceProps.put("classId", buildProperty("integer", "ID của lớp học muốn xem chuyên cần (tùy chọn)"));
            tools.add(buildToolSchema(
                    "getStudentAttendanceSummary",
                    "Xem tổng hợp tình hình chuyên cần và lịch sử điểm danh của học sinh (số buổi có mặt, đi muộn, vắng mặt, tỷ lệ chuyên cần) kèm đường dẫn chi tiết.",
                    studentAttendanceProps
            ));

            Map<String, Object> studentHomeworkProps = new HashMap<>();
            studentHomeworkProps.put("classId", buildProperty("integer", "ID của lớp học muốn lọc bài tập về nhà (tùy chọn)"));
            tools.add(buildToolSchema(
                    "getStudentHomeworks",
                    "Lấy danh sách bài tập về nhà được giao cho học sinh kèm hạn nộp, trạng thái làm bài (chưa nộp, đã nộp, đã chấm điểm) và đường dẫn làm bài tập.",
                    studentHomeworkProps
            ));
        }
        return tools;
    }

    /**
     * Điều phối thực thi công cụ dựa trên tên hàm và dữ liệu người dùng hiện tại
     */
    public String executeTool(String toolName, String argumentsJson, User currentUser) {
        if (currentUser == null) {
            return "Lỗi: Không thể xác thực thông tin người dùng.";
        }

        try {
            switch (toolName) {
                case "getTeacherClasses":
                    return executeGetTeacherClasses(currentUser);
                case "getTeacherTodaySchedule":
                    return executeGetTeacherTodaySchedule(currentUser);
                case "getTeacherExams":
                    return executeGetTeacherExams(currentUser);
                case "getTeacherAssignments":
                    return executeGetTeacherAssignments(currentUser);
                case "openQuickAttendanceSession":
                    return executeOpenQuickAttendanceSession(currentUser, argumentsJson);
                case "getTeacherClassAttendance":
                    return executeGetTeacherClassAttendance(currentUser, argumentsJson);
                case "getTeacherHomeworks":
                    return executeGetTeacherHomeworks(currentUser, argumentsJson);
                case "getStudentClasses":
                    return executeGetStudentClasses(currentUser);
                case "getStudentExams":
                    return executeGetStudentExams(currentUser);
                case "getStudentGrades":
                    return executeGetStudentGrades(currentUser);
                case "getStudentAttendanceSummary":
                    return executeGetStudentAttendanceSummary(currentUser, argumentsJson);
                case "getStudentHomeworks":
                    return executeGetStudentHomeworks(currentUser, argumentsJson);
                default:
                    return "Không tìm thấy công cụ: " + toolName;
            }
        } catch (Exception e) {
            log.error("Lỗi khi thực thi AI tool {}: {}", toolName, e.getMessage(), e);
            return "Đã xảy ra lỗi khi truy vấn dữ liệu: " + e.getMessage();
        }
    }

    private String executeGetTeacherClasses(User teacher) {
        if (classroomRepository == null) return "Chức năng tra cứu lớp học tạm thời không khả dụng.";
        List<Classroom> classrooms = classroomRepository.findAllByTeacher_Id(teacher.getId());
        if (classrooms.isEmpty()) {
            return "Thầy/Cô hiện chưa được phân công phụ trách lớp học nào trên hệ thống.";
        }
        StringBuilder sb = new StringBuilder("Danh sách lớp học Thầy/Cô đang phụ trách:\n");
        for (Classroom c : classrooms) {
            String subjectName = c.getSubject() != null ? c.getSubject().getName() : "Chưa rõ";
            sb.append("- Lớp: **").append(c.getName()).append("**")
                    .append(" (Mã lớp: `").append(c.getCode()).append("`")
                    .append(", Môn: ").append(subjectName)
                    .append(", Niên khóa: ").append(c.getAcademicYear() != null ? c.getAcademicYear() : "N/A")
                    .append(") -> [👉 Đến lớp học](/teacher/classes/").append(c.getId()).append(")\n");
        }
        return sb.toString();
    }

    private String executeGetTeacherTodaySchedule(User teacher) {
        if (classroomRepository == null || lessonRepository == null) {
            return "Chức năng tra cứu lịch dạy tạm thời không khả dụng.";
        }
        List<Classroom> classrooms = classroomRepository.findAllByTeacher_Id(teacher.getId());
        if (classrooms.isEmpty()) {
            return "Thầy/Cô hiện chưa có lớp học nào trên hệ thống.";
        }

        LocalDate today = LocalDate.now();
        List<String> scheduleItems = new ArrayList<>();

        for (Classroom c : classrooms) {
            List<Lesson> lessons = lessonRepository.findAllByClassroom_IdAndLessonDateOrderByStartTimeAsc(c.getId(), today);
            for (Lesson l : lessons) {
                String start = l.getStartTime() != null ? l.getStartTime().format(TIME_FORMATTER) : "N/A";
                String end = l.getEndTime() != null ? l.getEndTime().format(TIME_FORMATTER) : "N/A";
                scheduleItems.add("- Tiết dạy lớp **" + c.getName() + "**: " + start + " - " + end
                        + (l.getTitle() != null && !l.getTitle().isBlank() ? " (" + l.getTitle() + ")" : "")
                        + " [Mã điểm danh: `" + l.getAttendanceCode() + "`]"
                        + " -> [👉 Đến lớp](/teacher/classes/" + c.getId() + ")");
            }
        }

        if (scheduleItems.isEmpty()) {
            return "Hôm nay (" + today.format(DATE_FORMATTER) + ") Thầy/Cô không có tiết dạy nào được lên lịch.";
        }

        StringBuilder sb = new StringBuilder("Lịch dạy hôm nay (" + today.format(DATE_FORMATTER) + ") của Thầy/Cô:\n");
        for (String item : scheduleItems) {
            sb.append(item).append("\n");
        }
        return sb.toString();
    }

    private String executeGetTeacherExams(User teacher) {
        if (examRepository == null) return "Chức năng tra cứu đề thi tạm thời không khả dụng.";
        List<Exam> exams = examRepository.findAllByTeacher_Username(teacher.getUsername());
        if (exams.isEmpty()) {
            return "Thầy/Cô hiện chưa tạo đề thi nào trong ngân hàng đề thi.";
        }
        StringBuilder sb = new StringBuilder("Danh sách đề thi Thầy/Cô đã tạo:\n");
        int count = 0;
        for (Exam e : exams) {
            if (count++ >= 10) break;
            String subject = e.getSubject() != null ? e.getSubject().getName() : "Chưa rõ";
            String duration = e.getTimeLimit() != null ? e.getTimeLimit() + " phút" : "Không giới hạn";
            sb.append("- Đề thi: **").append(e.getTitle()).append("**")
                    .append(" (Mã: `").append(e.getCode()).append("`")
                    .append(", Môn: ").append(subject)
                    .append(", Thời lượng: ").append(duration)
                    .append(", Trạng thái: ").append(e.getStatus() != null ? e.getStatus() : "Hoạt động")
                    .append(") -> [👉 Xem chi tiết đề thi](/teacher/exams/").append(e.getId()).append(")\n");
        }
        return sb.toString();
    }

    private String executeGetTeacherAssignments(User teacher) {
        if (examRepository == null || examAssignmentRepository == null) {
            return "Chức năng tra cứu bài kiểm tra tạm thời không khả dụng.";
        }
        List<Exam> exams = examRepository.findAllByTeacher_Username(teacher.getUsername());
        if (exams.isEmpty()) {
            return "Thầy/Cô hiện chưa có đề thi hoặc bài kiểm tra nào trên hệ thống.";
        }
        List<Long> examIds = exams.stream().map(Exam::getId).toList();
        List<ExamAssignment> assignments = examAssignmentRepository.findAllByExam_IdIn(examIds);
        if (assignments.isEmpty()) {
            return "Thầy/Cô hiện chưa giao bài kiểm tra hoặc đợt thi nào cho các lớp học.";
        }
        StringBuilder sb = new StringBuilder("Danh sách bài kiểm tra / đợt thi Thầy/Cô đã giao:\n");
        int count = 0;
        for (ExamAssignment a : assignments) {
            if (count++ >= 10) break;
            String examTitle = a.getExam() != null ? a.getExam().getTitle() : "Bài thi";
            Long examId = a.getExam() != null ? a.getExam().getId() : 0L;
            String open = a.getOpenTime() != null ? a.getOpenTime().format(DATE_TIME_FORMATTER) : "Ngay bây giờ";
            String close = a.getCloseTime() != null ? a.getCloseTime().format(DATE_TIME_FORMATTER) : "Không giới hạn";
            sb.append("- Bài kiểm tra: **").append(examTitle).append("**")
                    .append(" (Bắt đầu: ").append(open)
                    .append(", Kết thúc: ").append(close)
                    .append(", Trạng thái: ").append(a.getStatus() != null ? a.getStatus() : "Đang mở")
                    .append(") -> [👉 Quản lý bài kiểm tra](/teacher/exams/").append(examId).append("/assignments/").append(a.getId()).append(")\n");
        }
        return sb.toString();
    }

    private String executeOpenQuickAttendanceSession(User teacher, String argumentsJson) {
        if (classroomRepository == null || lessonRepository == null) {
            return "Chức năng mở điểm danh tạm thời không khả dụng.";
        }
        Long classId = extractLong(argumentsJson, "classId");
        Integer duration = extractInteger(argumentsJson, "durationMinutes");
        int durationMinutes = (duration != null && duration > 0) ? duration : 15;

        Classroom targetClass = null;
        if (classId != null) {
            Optional<Classroom> cOpt = classroomRepository.findById(classId);
            if (cOpt.isEmpty() || cOpt.get().getTeacher() == null || !cOpt.get().getTeacher().getId().equals(teacher.getId())) {
                return "Không tìm thấy lớp học với ID " + classId + " thuộc quyền quản lý của Thầy/Cô.";
            }
            targetClass = cOpt.get();
        } else {
            List<Classroom> teacherClasses = classroomRepository.findAllByTeacher_Id(teacher.getId());
            if (teacherClasses.isEmpty()) {
                return "Thầy/Cô hiện chưa phụ trách lớp học nào để mở điểm danh.";
            }
            if (teacherClasses.size() == 1) {
                targetClass = teacherClasses.get(0);
            } else {
                StringBuilder sb = new StringBuilder("Thầy/Cô đang phụ trách nhiều lớp. Vui lòng chọn lớp học cụ thể để mở điểm danh:\n");
                for (Classroom c : teacherClasses) {
                    sb.append("- Lớp: **").append(c.getName()).append("** (Mã: `").append(c.getCode()).append("`)")
                            .append(" -> [👉 Điểm danh lớp ").append(c.getName()).append("](/teacher/classes/").append(c.getId()).append("/attendance)\n");
                }
                return sb.toString();
            }
        }

        LocalDate today = LocalDate.now();
        List<Lesson> todayLessons = lessonRepository.findAllByClassroom_IdAndLessonDateOrderByStartTimeAsc(targetClass.getId(), today);
        if (!todayLessons.isEmpty()) {
            Lesson existing = todayLessons.get(0);
            return "Phiên điểm danh hôm nay của lớp **" + targetClass.getName() + "** đã được kích hoạt trước đó:\n"
                    + "- Mã điểm danh: `" + existing.getAttendanceCode() + "`\n"
                    + "- Giờ bắt đầu: " + (existing.getStartTime() != null ? existing.getStartTime().format(TIME_FORMATTER) : "Chưa rõ") + "\n"
                    + "- Giờ tính đi muộn: " + (existing.getLateTime() != null ? existing.getLateTime().format(TIME_FORMATTER) : "Chưa rõ") + "\n"
                    + "- Giờ kết thúc: " + (existing.getEndTime() != null ? existing.getEndTime().format(TIME_FORMATTER) : "Chưa rõ") + "\n"
                    + "-> [👉 Mở phòng điểm danh lớp " + targetClass.getName() + "](/teacher/classes/" + targetClass.getId() + "/attendance)\n";
        }

        String code = String.format("%06d", (int) (Math.random() * 900000) + 100000);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lateTime = now.plusMinutes(durationMinutes);
        LocalDateTime endTime = now.plusHours(2);

        Lesson newLesson = Lesson.builder()
                .classroom(targetClass)
                .title("Buổi học ngày " + today.format(DATE_FORMATTER))
                .lessonDate(today)
                .attendanceCode(code)
                .startTime(now)
                .lateTime(lateTime)
                .endTime(endTime)
                .build();
        lessonRepository.save(newLesson);

        return "Đã mở phiên điểm danh nhanh thành công cho lớp **" + targetClass.getName() + "**:\n"
                + "- Mã điểm danh: `" + code + "`\n"
                + "- Thời gian bắt đầu: " + now.format(TIME_FORMATTER) + "\n"
                + "- Giờ tính đi muộn: " + lateTime.format(TIME_FORMATTER) + " (" + durationMinutes + " phút)\n"
                + "- Giờ kết thúc dự kiến: " + endTime.format(TIME_FORMATTER) + "\n"
                + "-> [👉 Mở phòng điểm danh lớp " + targetClass.getName() + "](/teacher/classes/" + targetClass.getId() + "/attendance)\n";
    }

    private String executeGetTeacherClassAttendance(User teacher, String argumentsJson) {
        if (attendanceRepository == null || classroomRepository == null) {
            return "Chức năng tra cứu điểm danh tạm thời không khả dụng.";
        }
        Long classId = extractLong(argumentsJson, "classId");
        LocalDate date = extractLocalDate(argumentsJson, "date");

        Classroom targetClass = null;
        if (classId != null) {
            Optional<Classroom> cOpt = classroomRepository.findById(classId);
            if (cOpt.isEmpty() || cOpt.get().getTeacher() == null || !cOpt.get().getTeacher().getId().equals(teacher.getId())) {
                return "Không tìm thấy lớp học với ID " + classId + " thuộc quyền quản lý của Thầy/Cô.";
            }
            targetClass = cOpt.get();
        } else {
            List<Classroom> teacherClasses = classroomRepository.findAllByTeacher_Id(teacher.getId());
            if (teacherClasses.isEmpty()) {
                return "Thầy/Cô hiện chưa phụ trách lớp học nào.";
            }
            if (teacherClasses.size() == 1) {
                targetClass = teacherClasses.get(0);
            } else {
                StringBuilder sb = new StringBuilder("Thầy/Cô đang phụ trách nhiều lớp. Dưới đây là danh sách để xem điểm danh:\n");
                for (Classroom c : teacherClasses) {
                    sb.append("- Lớp: **").append(c.getName()).append("** (Mã: `").append(c.getCode()).append("`)")
                            .append(" -> [👉 Xem điểm danh](/teacher/classes/").append(c.getId()).append("/attendance)\n");
                }
                return sb.toString();
            }
        }

        LocalDate queryDate = date != null ? date : LocalDate.now();
        List<Attendance> attendances = attendanceRepository.findAllByClassroomIdAndDate(targetClass.getId(), queryDate);
        if (attendances.isEmpty() && date == null) {
            attendances = attendanceRepository.findAllByClassroom_IdOrderByDateDesc(targetClass.getId());
        }

        if (attendances.isEmpty()) {
            return "Lớp **" + targetClass.getName() + "** chưa có bản ghi điểm danh nào"
                    + (date != null ? " vào ngày " + queryDate.format(DATE_FORMATTER) : "") + ".\n"
                    + "-> [👉 Mở phòng điểm danh](/teacher/classes/" + targetClass.getId() + "/attendance)\n";
        }

        long presentCount = attendances.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT).count();
        long lateCount = attendances.stream().filter(a -> a.getStatus() == AttendanceStatus.LATE).count();
        long absentCount = attendances.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();

        StringBuilder sb = new StringBuilder("Tình hình điểm danh lớp **").append(targetClass.getName()).append("**");
        if (date != null) {
            sb.append(" ngày ").append(queryDate.format(DATE_FORMATTER));
        }
        sb.append(":\n")
                .append("- Tổng số lượt ghi nhận: ").append(attendances.size()).append("\n")
                .append("- Có mặt: ").append(presentCount).append(" học sinh\n")
                .append("- Đi muộn: ").append(lateCount).append(" học sinh\n")
                .append("- Vắng mặt: ").append(absentCount).append(" học sinh\n");

        if (lessonRepository != null) {
            List<Lesson> todayLessons = lessonRepository.findAllByClassroom_IdAndLessonDateOrderByStartTimeAsc(targetClass.getId(), queryDate);
            if (!todayLessons.isEmpty()) {
                sb.append("- Mã điểm danh buổi học: `").append(todayLessons.get(0).getAttendanceCode()).append("`\n");
            }
        }

        sb.append("-> [👉 Quản lý chi tiết điểm danh lớp ").append(targetClass.getName()).append("](/teacher/classes/").append(targetClass.getId()).append("/attendance)\n");
        return sb.toString();
    }

    private String executeGetTeacherHomeworks(User teacher, String argumentsJson) {
        if (homeworkReadService == null) {
            return "Chức năng tra cứu bài tập về nhà tạm thời không khả dụng.";
        }
        Long classId = extractLong(argumentsJson, "classId");
        List<HomeworkDtos.Assignment> assignments = homeworkReadService.listForTeacher(teacher.getUsername(), classId);
        if (assignments == null || assignments.isEmpty()) {
            return "Thầy/Cô hiện chưa giao bài tập về nhà nào" + (classId != null ? " cho lớp này." : " trên hệ thống.");
        }

        StringBuilder sb = new StringBuilder("Danh sách bài tập về nhà Thầy/Cô đã giao:\n");
        int count = 0;
        for (HomeworkDtos.Assignment hw : assignments) {
            if (count++ >= 10) break;
            String due = hw.dueAt() != null ? hw.dueAt().format(DATE_TIME_FORMATTER) : "Không giới hạn";
            sb.append("- Bài tập: **").append(hw.title()).append("**")
                    .append(" (Môn: ").append(hw.subjectName() != null ? hw.subjectName() : "Chưa rõ")
                    .append(", Hạn nộp: ").append(due)
                    .append(", Đã nộp: ").append(hw.submittedCount()).append("/").append(hw.recipientCount())
                    .append(", Đã chấm: ").append(hw.gradedCount()).append(")")
                    .append(" -> [👉 Chấm bài: ").append(hw.title()).append("](/teacher/homework/").append(hw.id()).append(")\n");
        }
        if (classId != null) {
            sb.append("-> [👉 Quản lý bài tập của lớp](/teacher/classes/").append(classId).append("/homework)\n");
        }
        return sb.toString();
    }

    private String executeGetStudentClasses(User student) {
        if (classStudentRepository == null) return "Chức năng tra cứu lớp học tạm thời không khả dụng.";
        List<ClassroomSummaryProjection> summaries = classStudentRepository.findClassSummariesByStudentId(student.getId());
        if (summaries.isEmpty()) {
            return "Bạn hiện chưa tham gia lớp học nào trên hệ thống.";
        }
        StringBuilder sb = new StringBuilder("Danh sách các lớp học bạn đang tham gia:\n");
        for (ClassroomSummaryProjection c : summaries) {
            String teacherName = c.getTeacherName() != null ? c.getTeacherName() : "Chưa phân công";
            String subjectName = c.getSubjectName() != null ? c.getSubjectName() : "Chưa rõ";
            sb.append("- Lớp: **").append(c.getName()).append("**")
                    .append(" (Mã: `").append(c.getCode()).append("`")
                    .append(", Môn: ").append(subjectName)
                    .append(", GV: ").append(teacherName)
                    .append(") -> [👉 Đến lớp học](/student/classes/").append(c.getId()).append(")\n");
        }
        return sb.toString();
    }

    private String executeGetStudentExams(User student) {
        if (studentExamReadService == null) return "Chức năng tra cứu bài thi tạm thời không khả dụng.";
        StudentExamResponse.Page examPage = studentExamReadService.list(student.getUsername(), 0, 10, "", null, null, "newest");
        if (examPage == null || examPage.items() == null || examPage.items().isEmpty()) {
            return "Bạn hiện chưa có bài thi hoặc bài kiểm tra nào được giao.";
        }
        StringBuilder sb = new StringBuilder("Danh sách bài thi / bài kiểm tra được giao cho bạn:\n");
        for (StudentExamResponse item : examPage.items()) {
            String close = item.closeTime() != null ? item.closeTime().format(DATE_TIME_FORMATTER) : "Không giới hạn";
            String duration = item.timeLimit() != null ? item.timeLimit() + " phút" : "Không giới hạn";
            sb.append("- Bài thi: **").append(item.title()).append("**")
                    .append(" (Mã: `").append(item.code()).append("`")
                    .append(", Trạng thái: ").append(item.attemptStatus() != null ? item.attemptStatus() : "Chưa làm")
                    .append(", Thời gian: ").append(duration)
                    .append(", Hạn nộp: ").append(close)
                    .append(") -> [👉 Vào phòng thi](/student/exams/").append(item.assignmentId()).append(")\n");
        }
        return sb.toString();
    }

    private String executeGetStudentGrades(User student) {
        if (studentExamReadService == null) return "Chức năng tra cứu điểm số tạm thời không khả dụng.";
        StudentGradesResponse grades = studentExamReadService.grades(student.getUsername(), null, null, null, null, "", null, "newest", 0, 10, false);
        if (grades == null || grades.items() == null || grades.items().isEmpty()) {
            return "Bạn hiện chưa có điểm bài thi nào được ghi nhận trên hệ thống.";
        }
        StringBuilder sb = new StringBuilder("Kết quả điểm số các bài kiểm tra gần nhất của bạn:\n");
        for (StudentGradesResponse.Item item : grades.items()) {
            String scoreStr = item.score() != null ? item.score().toString() + "/10" : "Chờ chấm";
            String time = item.submittedAt() != null ? item.submittedAt().format(DATE_TIME_FORMATTER) : "Chưa rõ";
            sb.append("- Bài thi: **").append(item.title()).append("**")
                    .append(" - Điểm số: **").append(scoreStr).append("**")
                    .append(" (Môn: ").append(item.subjectName() != null ? item.subjectName() : "Chưa rõ")
                    .append(", Nộp lúc: ").append(time).append(")")
                    .append(" -> [👉 Xem chi tiết kết quả](/student/exam-attempts/").append(item.attemptId()).append("/result)\n");
        }
        return sb.toString();
    }

    private String executeGetStudentAttendanceSummary(User student, String argumentsJson) {
        if (attendanceRepository == null) {
            return "Chức năng tra cứu điểm danh tạm thời không khả dụng.";
        }
        Long classId = extractLong(argumentsJson, "classId");
        List<Attendance> attendances;
        if (classId != null) {
            attendances = attendanceRepository.findAllByClassroom_IdAndStudent_IdOrderByDateDesc(classId, student.getId());
        } else {
            attendances = attendanceRepository.findAllByStudent_Id(student.getId());
        }

        if (attendances == null || attendances.isEmpty()) {
            return "Bạn hiện chưa có dữ liệu điểm danh nào được ghi nhận trên hệ thống.";
        }

        long presentCount = attendances.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT).count();
        long lateCount = attendances.stream().filter(a -> a.getStatus() == AttendanceStatus.LATE).count();
        long absentCount = attendances.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();
        long total = attendances.size();
        double rate = total > 0 ? ((presentCount + lateCount) * 100.0) / total : 0.0;

        StringBuilder sb = new StringBuilder("Tổng hợp tình hình chuyên cần điểm danh của bạn:\n");
        sb.append("- Tổng số buổi đã điểm danh: ").append(total).append("\n")
                .append("- Có mặt đúng giờ: ").append(presentCount).append(" buổi\n")
                .append("- Đi muộn: ").append(lateCount).append(" buổi\n")
                .append("- Vắng mặt: ").append(absentCount).append(" buổi\n")
                .append("- Tỷ lệ chuyên cần: **").append(String.format(Locale.US, "%.1f", rate)).append("%**\n\n")
                .append("Các buổi gần nhất:\n");

        int count = 0;
        for (Attendance a : attendances) {
            if (count++ >= 5) break;
            String className = a.getClassroom() != null ? a.getClassroom().getName() : "Lớp học";
            String statusText = a.getStatus() == AttendanceStatus.PRESENT ? "Có mặt"
                    : a.getStatus() == AttendanceStatus.LATE ? "Đi muộn" : "Vắng";
            sb.append("- Ngày ").append(a.getDate() != null ? a.getDate().format(DATE_FORMATTER) : "Chưa rõ")
                    .append(" (").append(className).append("): **").append(statusText).append("**");
            if (a.getNote() != null && !a.getNote().isBlank()) {
                sb.append(" (Ghi chú: ").append(a.getNote()).append(")");
            }
            sb.append("\n");
        }

        sb.append("-> [👉 Xem lịch sử điểm danh đầy đủ](/student/attendance)\n");
        if (classId != null) {
            sb.append("-> [👉 Vào lớp học](/student/classes/").append(classId).append(")\n");
        }
        return sb.toString();
    }

    private String executeGetStudentHomeworks(User student, String argumentsJson) {
        if (homeworkReadService == null) {
            return "Chức năng tra cứu bài tập về nhà tạm thời không khả dụng.";
        }
        Long classId = extractLong(argumentsJson, "classId");
        List<HomeworkDtos.StudentAssignment> homeworks = homeworkReadService.listForStudent(student.getUsername(), classId);
        if (homeworks == null || homeworks.isEmpty()) {
            return "Bạn hiện không có bài tập về nhà nào cần nộp.";
        }

        StringBuilder sb = new StringBuilder("Danh sách bài tập về nhà được giao cho bạn:\n");
        int count = 0;
        for (HomeworkDtos.StudentAssignment h : homeworks) {
            if (count++ >= 10) break;
            HomeworkDtos.Assignment a = h.assignment();
            String title = a != null ? a.title() : "Bài tập";
            String due = (a != null && a.dueAt() != null) ? a.dueAt().format(DATE_TIME_FORMATTER) : "Không giới hạn";
            String status = "Chưa nộp";
            if ("SUBMITTED".equalsIgnoreCase(h.submissionStatus())) status = "Đã nộp bài";
            else if ("GRADED".equalsIgnoreCase(h.submissionStatus())) {
                status = "Đã chấm: " + (h.score() != null ? h.score() + " điểm" : "");
            }

            long assignmentId = a != null ? a.id() : 0;
            sb.append("- Bài tập: **").append(title).append("**")
                    .append(" (Hạn nộp: ").append(due)
                    .append(", Trạng thái: ").append(status).append(")")
                    .append(" -> [👉 Làm bài tập: ").append(title).append("](/student/homework/").append(assignmentId).append(")\n");
        }
        if (classId != null) {
            sb.append("-> [👉 Vào lớp học](/student/classes/").append(classId).append(")\n");
        }
        return sb.toString();
    }

    private Long extractLong(String argumentsJson, String fieldName) {
        if (argumentsJson == null || argumentsJson.isBlank() || "{}".equals(argumentsJson.trim())) {
            return null;
        }
        try {
            JsonNode root = objectMapper.readTree(argumentsJson);
            if (root.has(fieldName) && !root.get(fieldName).isNull()) {
                return root.get(fieldName).asLong();
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private Integer extractInteger(String argumentsJson, String fieldName) {
        if (argumentsJson == null || argumentsJson.isBlank() || "{}".equals(argumentsJson.trim())) {
            return null;
        }
        try {
            JsonNode root = objectMapper.readTree(argumentsJson);
            if (root.has(fieldName) && !root.get(fieldName).isNull()) {
                return root.get(fieldName).asInt();
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private LocalDate extractLocalDate(String argumentsJson, String fieldName) {
        if (argumentsJson == null || argumentsJson.isBlank() || "{}".equals(argumentsJson.trim())) {
            return null;
        }
        try {
            JsonNode root = objectMapper.readTree(argumentsJson);
            if (root.has(fieldName) && !root.get(fieldName).isNull()) {
                String text = root.get(fieldName).asText();
                if (text != null && !text.isBlank()) {
                    return LocalDate.parse(text);
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private Map<String, Object> buildProperty(String type, String description) {
        Map<String, Object> prop = new HashMap<>();
        prop.put("type", type);
        prop.put("description", description);
        return prop;
    }

    private Map<String, Object> buildToolSchema(String name, String description, Map<String, Object> properties) {
        Map<String, Object> function = new HashMap<>();
        function.put("name", name);
        function.put("description", description);
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("type", "object");
        parameters.put("properties", properties);
        parameters.put("required", List.of());
        function.put("parameters", parameters);

        Map<String, Object> tool = new HashMap<>();
        tool.put("type", "function");
        tool.put("function", function);
        return tool;
    }
}
