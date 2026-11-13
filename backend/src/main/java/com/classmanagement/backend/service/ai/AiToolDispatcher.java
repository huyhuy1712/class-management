package com.classmanagement.backend.service.ai;

import com.classmanagement.backend.dto.exam.StudentExamResponse;
import com.classmanagement.backend.dto.exam.StudentGradesResponse;
import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.entity.Exam;
import com.classmanagement.backend.entity.ExamAssignment;
import com.classmanagement.backend.entity.Lesson;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.repository.LessonRepository;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import com.classmanagement.backend.repository.classroom.ClassroomRepository;
import com.classmanagement.backend.repository.exam.ExamAssignmentRepository;
import com.classmanagement.backend.repository.exam.ExamRepository;
import com.classmanagement.backend.repository.projection.ClassroomSummaryProjection;
import com.classmanagement.backend.service.exam.StudentExamReadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiToolDispatcher {

    private final ClassroomRepository classroomRepository;
    private final ClassStudentRepository classStudentRepository;
    private final LessonRepository lessonRepository;
    private final ExamRepository examRepository;
    private final ExamAssignmentRepository examAssignmentRepository;
    private final StudentExamReadService studentExamReadService;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

    public AiToolDispatcher(ClassroomRepository classroomRepository,
                            ClassStudentRepository classStudentRepository,
                            LessonRepository lessonRepository) {
        this(classroomRepository, classStudentRepository, lessonRepository, null, null, null);
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
                case "getStudentClasses":
                    return executeGetStudentClasses(currentUser);
                case "getStudentExams":
                    return executeGetStudentExams(currentUser);
                case "getStudentGrades":
                    return executeGetStudentGrades(currentUser);
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
                    .append(", Trạng thái: ").append(c.getStatus())
                    .append(") -> [👉 Đến lớp học](/teacher/classes/").append(c.getId()).append(")\n");
        }
        return sb.toString();
    }

    private String executeGetTeacherTodaySchedule(User teacher) {
        if (classroomRepository == null || lessonRepository == null) return "Chức năng tra cứu lịch dạy tạm thời không khả dụng.";
        List<Classroom> classrooms = classroomRepository.findAllByTeacher_Id(teacher.getId());
        if (classrooms.isEmpty()) {
            return "Thầy/Cô hiện chưa có lớp học nào trên hệ thống.";
        }

        LocalDate today = LocalDate.now();
        List<String> todayLessons = new ArrayList<>();

        for (Classroom c : classrooms) {
            List<Lesson> lessons = lessonRepository.findAllByClassroom_IdAndLessonDateOrderByStartTimeAsc(c.getId(), today);
            for (Lesson l : lessons) {
                String start = l.getStartTime() != null ? l.getStartTime().format(TIME_FORMATTER) : "Chưa đặt";
                String end = l.getEndTime() != null ? l.getEndTime().format(TIME_FORMATTER) : "Chưa đặt";
                String title = l.getTitle() != null && !l.getTitle().isBlank() ? l.getTitle() : "Tiết học tiêu chuẩn";
                todayLessons.add("- Lớp **" + c.getName() + "** (" + (c.getSubject() != null ? c.getSubject().getName() : "") + "): "
                        + title + " [" + start + " - " + end + "] -> [👉 Đến lớp](/teacher/classes/" + c.getId() + ")");
            }
        }

        if (todayLessons.isEmpty()) {
            return "Hôm nay (" + today + "), Thầy/Cô không có lịch dạy nào trên hệ thống.";
        }

        return "Lịch dạy hôm nay (" + today + "):\n" + String.join("\n", todayLessons);
    }

    private String executeGetTeacherExams(User teacher) {
        if (examRepository == null) return "Chức năng tra cứu đề thi tạm thời không khả dụng.";
        List<Exam> exams = examRepository.findAllByTeacher_Username(teacher.getUsername());
        if (exams.isEmpty()) {
            return "Thầy/Cô hiện chưa tạo đề thi nào trong ngân hàng đề thi.";
        }
        StringBuilder sb = new StringBuilder("Danh sách đề thi Thầy/Cô đã tạo trong ngân hàng đề thi:\n");
        for (Exam e : exams) {
            String subjectName = e.getSubject() != null ? e.getSubject().getName() : "Chưa rõ";
            String duration = e.getTimeLimit() != null ? e.getTimeLimit() + " phút" : "Không giới hạn";
            sb.append("- Đề thi: **").append(e.getTitle()).append("**")
                    .append(" (Mã: `").append(e.getCode()).append("`")
                    .append(", Môn: ").append(subjectName)
                    .append(", Thời gian: ").append(duration)
                    .append(", Trạng thái: ").append(e.getStatus())
                    .append(") -> [👉 Xem chi tiết đề thi](/teacher/exams/").append(e.getId()).append(")\n");
        }
        return sb.toString();
    }

    private String executeGetTeacherAssignments(User teacher) {
        if (examRepository == null || examAssignmentRepository == null) return "Chức năng tra cứu bài giao tạm thời không khả dụng.";
        List<Exam> exams = examRepository.findAllByTeacher_Username(teacher.getUsername());
        if (exams.isEmpty()) {
            return "Thầy/Cô hiện chưa có bài kiểm tra nào được giao cho các lớp học.";
        }
        List<Long> examIds = exams.stream().map(Exam::getId).toList();
        List<ExamAssignment> assignments = examAssignmentRepository.findAllByExam_IdIn(examIds);
        if (assignments.isEmpty()) {
            return "Thầy/Cô hiện chưa giao đợt kiểm tra nào từ các đề thi đã tạo.";
        }
        StringBuilder sb = new StringBuilder("Danh sách bài kiểm tra Thầy/Cô đã giao cho học sinh:\n");
        for (ExamAssignment a : assignments) {
            String examTitle = a.getExam() != null ? a.getExam().getTitle() : "Bài kiểm tra";
            Long examId = a.getExam() != null ? a.getExam().getId() : 0L;
            String open = a.getOpenTime() != null ? a.getOpenTime().format(DATE_TIME_FORMATTER) : "Không giới hạn";
            String close = a.getCloseTime() != null ? a.getCloseTime().format(DATE_TIME_FORMATTER) : "Không giới hạn";
            sb.append("- Bài kiểm tra: **").append(examTitle).append("**")
                    .append(" (Trạng thái: ").append(a.getStatus())
                    .append(", Mở lúc: ").append(open)
                    .append(", Hạn chót: ").append(close)
                    .append(") -> [👉 Quản lý bài kiểm tra](/teacher/exams/").append(examId).append("/assignments/").append(a.getId()).append(")\n");
        }
        return sb.toString();
    }

    private String executeGetStudentClasses(User student) {
        if (classStudentRepository == null) return "Chức năng tra cứu lớp học tạm thời không khả dụng.";
        List<ClassroomSummaryProjection> summaries = classStudentRepository.findClassSummariesByStudentId(student.getId());
        if (summaries.isEmpty()) {
            return "Bạn hiện chưa tham gia lớp học nào trên hệ thống.";
        }
        StringBuilder sb = new StringBuilder("Danh sách lớp học bạn đang tham gia:\n");
        for (ClassroomSummaryProjection c : summaries) {
            sb.append("- Lớp: **").append(c.getName()).append("**")
                    .append(" (Môn học: ").append(c.getSubjectName() != null ? c.getSubjectName() : "Chưa rõ")
                    .append(", Giáo viên: ").append(c.getTeacherName() != null ? c.getTeacherName() : "Chưa rõ")
                    .append(", Niên khóa: ").append(c.getAcademicYear() != null ? c.getAcademicYear() : "N/A")
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
            String open = item.openTime() != null ? item.openTime().format(DATE_TIME_FORMATTER) : "Bắt đầu ngay";
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
