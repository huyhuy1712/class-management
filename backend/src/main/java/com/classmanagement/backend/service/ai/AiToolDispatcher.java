package com.classmanagement.backend.service.ai;

import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.entity.Lesson;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.repository.LessonRepository;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import com.classmanagement.backend.repository.classroom.ClassroomRepository;
import com.classmanagement.backend.repository.projection.ClassroomSummaryProjection;
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

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    /**
     * Trả về danh sách schema công cụ phù hợp với vai trò của người dùng
     */
    public List<Map<String, Object>> getToolsForRole(String role) {
        List<Map<String, Object>> tools = new ArrayList<>();
        if ("TEACHER".equalsIgnoreCase(role)) {
            tools.add(buildToolSchema(
                    "getTeacherClasses",
                    "Lấy danh sách các lớp học mà giáo viên đang phụ trách giảng dạy trên hệ thống FrogH (tên lớp, môn học, mã lớp, niên khóa).",
                    Map.of()
            ));
            tools.add(buildToolSchema(
                    "getTeacherTodaySchedule",
                    "Lấy lịch dạy hoặc danh sách các tiết học trong ngày hôm nay của giáo viên.",
                    Map.of()
            ));
        } else if ("STUDENT".equalsIgnoreCase(role)) {
            tools.add(buildToolSchema(
                    "getStudentClasses",
                    "Lấy danh sách các lớp học mà học sinh đang tham gia học tập trên hệ thống FrogH.",
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
                case "getStudentClasses":
                    return executeGetStudentClasses(currentUser);
                default:
                    return "Không tìm thấy công cụ: " + toolName;
            }
        } catch (Exception e) {
            log.error("Lỗi khi thực thi AI tool {}: {}", toolName, e.getMessage(), e);
            return "Đã xảy ra lỗi khi truy vấn dữ liệu: " + e.getMessage();
        }
    }

    private String executeGetTeacherClasses(User teacher) {
        List<Classroom> classrooms = classroomRepository.findAllByTeacher_Id(teacher.getId());
        if (classrooms.isEmpty()) {
            return "Thầy/Cô hiện chưa được phân công phụ trách lớp học nào trên hệ thống.";
        }
        StringBuilder sb = new StringBuilder("Danh sách lớp học Thầy/Cô đang phụ trách:\n");
        for (Classroom c : classrooms) {
            String subjectName = c.getSubject() != null ? c.getSubject().getName() : "Chưa rõ";
            sb.append("- Lớp: ").append(c.getName())
                    .append(" (Mã lớp: ").append(c.getCode())
                    .append(", Môn học: ").append(subjectName)
                    .append(", Niên khóa: ").append(c.getAcademicYear() != null ? c.getAcademicYear() : "N/A")
                    .append(", Trạng thái: ").append(c.getStatus())
                    .append(")\n");
        }
        return sb.toString();
    }

    private String executeGetTeacherTodaySchedule(User teacher) {
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
                todayLessons.add("- Lớp " + c.getName() + " (" + (c.getSubject() != null ? c.getSubject().getName() : "") + "): "
                        + title + " [" + start + " - " + end + "]");
            }
        }

        if (todayLessons.isEmpty()) {
            return "Hôm nay (" + today + "), Thầy/Cô không có lịch dạy nào trên hệ thống.";
        }

        return "Lịch dạy hôm nay (" + today + "):\n" + String.join("\n", todayLessons);
    }

    private String executeGetStudentClasses(User student) {
        List<ClassroomSummaryProjection> summaries = classStudentRepository.findClassSummariesByStudentId(student.getId());
        if (summaries.isEmpty()) {
            return "Bạn hiện chưa tham gia lớp học nào trên hệ thống.";
        }
        StringBuilder sb = new StringBuilder("Danh sách lớp học bạn đang tham gia:\n");
        for (ClassroomSummaryProjection c : summaries) {
            sb.append("- Lớp: ").append(c.getName())
                    .append(" (Môn học: ").append(c.getSubjectName() != null ? c.getSubjectName() : "Chưa rõ")
                    .append(", Giáo viên: ").append(c.getTeacherName() != null ? c.getTeacherName() : "Chưa rõ")
                    .append(", Niên khóa: ").append(c.getAcademicYear() != null ? c.getAcademicYear() : "N/A")
                    .append(")\n");
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
