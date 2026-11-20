package com.classmanagement.backend.service.ai;

import com.classmanagement.backend.dto.exam.StudentExamResponse;
import com.classmanagement.backend.dto.exam.StudentGradesResponse;
import com.classmanagement.backend.dto.homework.HomeworkDtos;
import com.classmanagement.backend.dto.material.MaterialDocumentResponse;
import com.classmanagement.backend.entity.Attendance;
import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.entity.Exam;
import com.classmanagement.backend.entity.ExamAssignment;
import com.classmanagement.backend.entity.Lesson;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.AttendanceStatus;
import com.classmanagement.backend.entity.enums.ClassroomStatus;
import com.classmanagement.backend.entity.enums.ExamAssignmentStatus;
import com.classmanagement.backend.entity.enums.ExamStatus;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.repository.AttendanceRepository;
import com.classmanagement.backend.repository.LessonRepository;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import com.classmanagement.backend.repository.classroom.ClassroomRepository;
import com.classmanagement.backend.repository.exam.ExamAssignmentRepository;
import com.classmanagement.backend.repository.exam.ExamRepository;
import com.classmanagement.backend.repository.projection.ClassroomSummaryProjection;
import com.classmanagement.backend.service.MaterialService;
import com.classmanagement.backend.service.billing.TeacherEntitlementService;
import com.classmanagement.backend.service.exam.StudentExamReadService;
import com.classmanagement.backend.service.homework.queries.HomeworkReadService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Supplier;

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
    private final MaterialService materialService;
    private final TeacherEntitlementService teacherEntitlementService;
    private final TransactionTemplate transactionTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final Set<String> TEACHER_TOOLS = Set.of(
            "getTeacherClasses",
            "getTeacherTodaySchedule",
            "getTeacherExams",
            "getTeacherAssignments",
            "openQuickAttendanceSession",
            "getTeacherClassAttendance",
            "getTeacherHomeworks",
            "getTeacherMaterials"
    );

    private static final Set<String> STUDENT_TOOLS = Set.of(
            "getStudentClasses",
            "getStudentExams",
            "getStudentGrades",
            "getStudentAttendanceSummary",
            "getStudentHomeworks",
            "getStudentMaterials"
    );

    private static final List<String> RESTRICTED_DOMAIN_KEYWORDS = List.of(
            "vip", "point", "billing", "order", "invoice", "mission",
            "history", "activity", "wallet", "vnpay", "momo", "payment", "redeem"
    );

    @Autowired
    public AiToolDispatcher(ClassroomRepository classroomRepository,
                            ClassStudentRepository classStudentRepository,
                            LessonRepository lessonRepository,
                            ExamRepository examRepository,
                            ExamAssignmentRepository examAssignmentRepository,
                            StudentExamReadService studentExamReadService,
                            AttendanceRepository attendanceRepository,
                            HomeworkReadService homeworkReadService,
                            MaterialService materialService,
                            TeacherEntitlementService teacherEntitlementService,
                            PlatformTransactionManager transactionManager) {
        this.classroomRepository = classroomRepository;
        this.classStudentRepository = classStudentRepository;
        this.lessonRepository = lessonRepository;
        this.examRepository = examRepository;
        this.examAssignmentRepository = examAssignmentRepository;
        this.studentExamReadService = studentExamReadService;
        this.attendanceRepository = attendanceRepository;
        this.homeworkReadService = homeworkReadService;
        this.materialService = materialService;
        this.teacherEntitlementService = teacherEntitlementService;
        this.transactionTemplate = transactionManager != null ? new TransactionTemplate(transactionManager) : null;
    }

    public AiToolDispatcher(ClassroomRepository classroomRepository,
                            ClassStudentRepository classStudentRepository,
                            LessonRepository lessonRepository,
                            ExamRepository examRepository,
                            ExamAssignmentRepository examAssignmentRepository,
                            StudentExamReadService studentExamReadService,
                            AttendanceRepository attendanceRepository,
                            HomeworkReadService homeworkReadService,
                            MaterialService materialService) {
        this(classroomRepository, classStudentRepository, lessonRepository,
                examRepository, examAssignmentRepository, studentExamReadService,
                attendanceRepository, homeworkReadService, materialService, null, null);
    }

    public AiToolDispatcher(ClassroomRepository classroomRepository,
                            ClassStudentRepository classStudentRepository,
                            LessonRepository lessonRepository,
                            ExamRepository examRepository,
                            ExamAssignmentRepository examAssignmentRepository,
                            StudentExamReadService studentExamReadService,
                            AttendanceRepository attendanceRepository,
                            HomeworkReadService homeworkReadService) {
        this(classroomRepository, classStudentRepository, lessonRepository,
                examRepository, examAssignmentRepository, studentExamReadService,
                attendanceRepository, homeworkReadService, null);
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
                    "Lấy TẤT CẢ các đề thi giáo viên đã tạo trong ngân hàng đề thi FrogH, bao gồm cả đề đang soạn (nháp/chưa giao) và đề đã xuất bản/đã giao, kèm trạng thái giao bài và đường dẫn chỉnh sửa/xem chi tiết đề thi (/teacher/exams/{examId}).",
                    Map.of()
            ));
            tools.add(buildToolSchema(
                    "getTeacherAssignments",
                    "Lấy danh sách các đợt thi hoặc bài kiểm tra giáo viên đã giao cho lớp học (thời gian mở/đóng, trạng thái) kèm đường dẫn quản lý đợt giao (/teacher/exams/{examId}/assignments/{assignmentId}). Nếu có đề chưa giao cũng liệt kê đường dẫn để giáo viên vào giao.",
                    Map.of()
            ));

            Map<String, Object> openAttendanceProps = new HashMap<>();
            openAttendanceProps.put("classId", buildProperty("integer", "ID lớp học (số nguyên dương > 0). Bỏ qua hoàn toàn nếu giáo viên chỉ dạy 1 lớp; không truyền null hoặc 0."));
            openAttendanceProps.put("durationMinutes", buildProperty("integer", "Thời lượng mở điểm danh tính theo phút (số nguyên dương, mặc định 15; bỏ qua nếu mặc định)."));
            tools.add(buildToolSchema(
                    "openQuickAttendanceSession",
                    "Mở phiên điểm danh nhanh cho lớp học, tự động sinh mã OTP điểm danh và thiết lập thời gian cho học sinh điểm danh kèm đường dẫn trực tiếp.",
                    openAttendanceProps
            ));

            Map<String, Object> classAttendanceProps = new HashMap<>();
            classAttendanceProps.put("classId", buildProperty("integer", "ID lớp học (số nguyên dương > 0). Bỏ qua hoàn toàn nếu muốn xem danh sách lớp; không truyền null hoặc 0."));
            classAttendanceProps.put("date", buildProperty("string", "Ngày cần xem điểm danh định dạng YYYY-MM-DD (bỏ qua nếu mặc định hôm nay)."));
            tools.add(buildToolSchema(
                    "getTeacherClassAttendance",
                    "Xem danh sách và thống kê tình hình điểm danh (có mặt, đi muộn, vắng mặt) của học sinh trong lớp học kèm mã điểm danh buổi học và đường dẫn quản lý.",
                    classAttendanceProps
            ));

            Map<String, Object> teacherHomeworkProps = new HashMap<>();
            teacherHomeworkProps.put("classId", buildProperty("integer", "CHỈ truyền số nguyên dương (> 0) nếu lọc theo 1 ID lớp cụ thể. BỎ QUA trường này (gửi {}) để đọc tất cả bài tập đã giao; không truyền null hay 0."));
            tools.add(buildToolSchema(
                    "getTeacherHomeworks",
                    "Đọc danh sách các bài tập về nhà giáo viên đã giao cho học sinh/lớp học (bao gồm cả đang mở và đã đóng) kèm môn học, hạn nộp, thống kê số bài đã nộp, đã chấm và đường dẫn chấm bài (/teacher/homework/{id}).",
                    teacherHomeworkProps
            ));

            Map<String, Object> teacherMaterialProps = new HashMap<>();
            teacherMaterialProps.put("classId", buildProperty("integer", "CHỈ truyền số nguyên dương (> 0) nếu lọc tài liệu phân phối cho 1 ID lớp cụ thể. BỎ QUA trường này (gửi {}) để đọc toàn bộ Kho tài liệu; không truyền null hay 0."));
            tools.add(buildToolSchema(
                    "getTeacherMaterials",
                    "Đọc CHỈ-ĐỌC danh sách tài liệu học tập (PDF, Word, PowerPoint, Excel, TXT, ZIP) giáo viên đã tải lên Kho tài liệu kèm phạm vi phân phối (tất cả lớp, theo lớp, từng học sinh) và đường dẫn (/teacher/materials).",
                    teacherMaterialProps
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
            studentAttendanceProps.put("classId", buildProperty("integer", "CHỈ truyền số nguyên dương (> 0) nếu lọc theo 1 ID lớp. Bỏ qua trường này (gửi {}) nếu xem toàn bộ; không truyền null hay 0."));
            tools.add(buildToolSchema(
                    "getStudentAttendanceSummary",
                    "Xem tổng hợp tình hình chuyên cần và lịch sử điểm danh của học sinh (số buổi có mặt, đi muộn, vắng mặt, tỷ lệ chuyên cần) kèm đường dẫn chi tiết.",
                    studentAttendanceProps
            ));

            Map<String, Object> studentHomeworkProps = new HashMap<>();
            studentHomeworkProps.put("classId", buildProperty("integer", "CHỈ truyền số nguyên dương (> 0) nếu lọc theo 1 ID lớp. Bỏ qua trường này (gửi {}) để đọc tất cả bài tập đã giao; không truyền null hay 0."));
            tools.add(buildToolSchema(
                    "getStudentHomeworks",
                    "Đọc danh sách bài tập về nhà đã giao cho học sinh kèm hạn nộp, trạng thái làm bài (chưa nộp, đã nộp, đã chấm điểm, yêu cầu làm lại) và đường dẫn làm bài tập (/student/homework/{id}).",
                    studentHomeworkProps
            ));

            Map<String, Object> studentMaterialProps = new HashMap<>();
            studentMaterialProps.put("classId", buildProperty("integer", "CHỈ truyền số nguyên dương (> 0) nếu lọc tài liệu của 1 lớp đang học. BỎ QUA trường này (gửi {}) để đọc tài liệu từ tất cả các lớp bạn tham gia; không truyền null hay 0."));
            tools.add(buildToolSchema(
                    "getStudentMaterials",
                    "Đọc CHỈ-ĐỌC danh sách tài liệu học tập được giáo viên chia sẻ cho học sinh trong các lớp đang học kèm đường dẫn vào lớp để xem/tải tệp.",
                    studentMaterialProps
            ));
        }
        return tools;
    }

    /**
     * Điều phối thực thi công cụ dựa trên tên hàm và dữ liệu người dùng hiện tại.
     * Kiểm tra phân quyền RBAC nghiêm ngặt trước khi thực thi; các nhánh JPA dùng TransactionTemplate riêng
     * để tránh xung đột isolation với các ReadService có @Transactional(isolation = REPEATABLE_READ).
     */
    public String executeTool(String toolName, String argumentsJson, User currentUser) {
        if (currentUser == null || currentUser.getRole() == null) {
            return "Lỗi: Không thể xác thực thông tin người dùng hoặc vai trò truy cập.";
        }
        if (currentUser.getStatus() != null && currentUser.getStatus() != UserStatus.ACTIVE) {
            return "Từ chối truy cập: Tài khoản của bạn hiện không ở trạng thái hoạt động.";
        }
        if (isRestrictedDomainTool(toolName)) {
            log.warn("SECURITY: Chặn AI truy cập vùng nhạy cảm '{}' từ tài khoản '{}' (role={})",
                    toolName, currentUser.getUsername(), currentUser.getRole());
            return "Từ chối truy cập: Hệ thống nghiêm cấm AI truy cập, tra cứu hoặc chỉnh sửa dữ liệu thuộc mục VIP & Point, Thanh toán hay Lịch sử hoạt động để đảm bảo an toàn phân quyền. AI chỉ hỗ trợ giải thích cách sử dụng các tính năng này.";
        }
        if (TEACHER_TOOLS.contains(toolName) && currentUser.getRole() != UserRole.TEACHER) {
            log.warn("SECURITY: Từ chối truy cập công cụ Giáo viên '{}' từ tài khoản '{}' (role={})",
                    toolName, currentUser.getUsername(), currentUser.getRole());
            return "Từ chối truy cập: Chức năng '" + toolName + "' chỉ dành riêng cho tài khoản Giáo viên. Bạn không có quyền truy cập dữ liệu hoặc thực hiện thao tác của Giáo viên.";
        }
        if (STUDENT_TOOLS.contains(toolName) && currentUser.getRole() != UserRole.STUDENT) {
            log.warn("SECURITY: Từ chối truy cập công cụ Học sinh '{}' từ tài khoản '{}' (role={})",
                    toolName, currentUser.getUsername(), currentUser.getRole());
            return "Từ chối truy cập: Chức năng '" + toolName + "' chỉ dành riêng cho tài khoản Học sinh.";
        }

        try {
            switch (toolName) {
                case "getTeacherClasses":
                    return runInTransaction(() -> executeGetTeacherClasses(currentUser));
                case "getTeacherTodaySchedule":
                    return runInTransaction(() -> executeGetTeacherTodaySchedule(currentUser));
                case "getTeacherExams":
                    return runInTransaction(() -> executeGetTeacherExams(currentUser));
                case "getTeacherAssignments":
                    return runInTransaction(() -> executeGetTeacherAssignments(currentUser));
                case "openQuickAttendanceSession":
                    return runInTransaction(() -> executeOpenQuickAttendanceSession(currentUser, argumentsJson));
                case "getTeacherClassAttendance":
                    return runInTransaction(() -> executeGetTeacherClassAttendance(currentUser, argumentsJson));
                case "getTeacherHomeworks":
                    return executeGetTeacherHomeworks(currentUser, argumentsJson);
                case "getTeacherMaterials":
                    return executeGetTeacherMaterials(currentUser, argumentsJson);
                case "getStudentClasses":
                    return runInTransaction(() -> executeGetStudentClasses(currentUser));
                case "getStudentExams":
                    return executeGetStudentExams(currentUser);
                case "getStudentGrades":
                    return executeGetStudentGrades(currentUser);
                case "getStudentAttendanceSummary":
                    return runInTransaction(() -> executeGetStudentAttendanceSummary(currentUser, argumentsJson));
                case "getStudentHomeworks":
                    return executeGetStudentHomeworks(currentUser, argumentsJson);
                case "getStudentMaterials":
                    return executeGetStudentMaterials(currentUser, argumentsJson);
                default:
                    return "Không tìm thấy công cụ: " + toolName;
            }
        } catch (Exception e) {
            log.error("Lỗi khi thực thi AI tool {}: {}", toolName, e.getMessage(), e);
            return "Đã xảy ra lỗi khi truy vấn dữ liệu: " + e.getMessage();
        }
    }

    private String runInTransaction(Supplier<String> action) {
        if (transactionTemplate == null) {
            return action.get();
        }
        return transactionTemplate.execute(status -> action.get());
    }

    private boolean isRestrictedDomainTool(String toolName) {
        if (toolName == null || toolName.isBlank()) {
            return false;
        }
        String lower = toolName.toLowerCase(Locale.ROOT);
        return RESTRICTED_DOMAIN_KEYWORDS.stream().anyMatch(lower::contains);
    }

    private String executeGetTeacherClasses(User teacher) {
        if (classroomRepository == null) return "Chức năng tra cứu lớp học tạm thời không khả dụng.";
        List<Classroom> classrooms = classroomRepository.findAllByTeacher_Id(teacher.getId());
        if (classrooms.isEmpty()) {
            return "Thầy/Cô hiện chưa được phân công phụ trách lớp học nào trên hệ thống.\n"
                    + "Hướng dẫn tạo lớp học mới trên FrogH:\n"
                    + "1. Vào mục **Quản lý lớp học** -> chọn **Tạo lớp học**.\n"
                    + "2. Nhập tên lớp, chọn môn học, niên khóa và bấm lưu để nhận mã mời lớp cho học sinh tham gia.\n"
                    + "[👉 Mở Quản lý lớp học](/teacher/classes)";
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
            return "Thầy/Cô hiện chưa có lớp học nào trên hệ thống nên chưa có lịch dạy.\n"
                    + "Thầy/Cô hãy tạo lớp học đầu tiên để bắt đầu lên lịch buổi học và điểm danh:\n"
                    + "[👉 Tạo / Quản lý lớp học](/teacher/classes)";
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
            return "Hôm nay (" + today.format(DATE_FORMATTER) + ") Thầy/Cô không có tiết dạy nào được lên lịch.\n"
                    + "Nếu muốn bắt đầu buổi học ngay hôm nay, Thầy/Cô có thể mở một lớp học và tạo phiên điểm danh (hoặc nhắn tôi: *\"Mở điểm danh nhanh\"*):\n"
                    + "[👉 Xem danh sách lớp học](/teacher/classes)";
        }

        StringBuilder sb = new StringBuilder("Lịch dạy hôm nay (" + today.format(DATE_FORMATTER) + ") của Thầy/Cô:\n");
        for (String item : scheduleItems) {
            sb.append(item).append("\n");
        }
        return sb.toString();
    }

    private String executeGetTeacherExams(User teacher) {
        if (examRepository == null) return "Chức năng tra cứu đề thi tạm thời không khả dụng.";
        List<Exam> exams = new ArrayList<>(examRepository.findAllByTeacher_Username(teacher.getUsername()));
        if (exams.isEmpty()) {
            return "Thầy/Cô hiện chưa tạo đề thi nào trong ngân hàng đề thi.\n"
                    + "Hướng dẫn tạo đề thi mới trên FrogH:\n"
                    + "1. Vào mục **Đề thi** -> bấm **Tạo đề thi** (hỗ trợ soạn câu hỏi trực tuyến hoặc nhập nhanh từ file PDF).\n"
                    + "2. Thiết lập tiêu đề, môn học, thời lượng làm bài và thêm câu hỏi.\n"
                    + "3. Khi hoàn tất, bấm **Xuất bản** và chọn lớp học để giao đề thi.\n"
                    + "[👉 Tạo đề thi mới](/teacher/exams/create) | [👉 Mở ngân hàng đề thi](/teacher/exams)";
        }
        exams.sort(newestExamComparator());

        Map<Long, Long> assignmentCountByExamId = countAssignmentsByExamId(exams);
        StringBuilder sb = new StringBuilder("Danh sách đề thi Thầy/Cô đã tạo (tổng " + exams.size() + " đề):\n");
        int count = 0;
        for (Exam e : exams) {
            if (count++ >= 15) break;
            String subject = e.getSubject() != null ? e.getSubject().getName() : "Chưa rõ";
            String duration = e.getTimeLimit() != null ? e.getTimeLimit() + " phút" : "Không giới hạn";
            long assignedCount = e.getId() != null ? assignmentCountByExamId.getOrDefault(e.getId(), 0L) : 0L;
            String assignText = assignedCount > 0 ? "Đã giao " + assignedCount + " đợt" : "Chưa giao";
            sb.append("- Đề thi: **").append(e.getTitle()).append("**")
                    .append(" (Mã: `").append(e.getCode()).append("`")
                    .append(", Môn: ").append(subject)
                    .append(", Thời lượng: ").append(duration)
                    .append(", Trạng thái: ").append(formatExamStatus(e.getStatus()))
                    .append(", Giao bài: ").append(assignText)
                    .append(") -> [👉 Xem chi tiết đề thi](/teacher/exams/").append(e.getId()).append(")\n");
        }
        sb.append("[👉 Mở ngân hàng đề thi](/teacher/exams)\n");
        return sb.toString();
    }

    private String executeGetTeacherAssignments(User teacher) {
        if (examRepository == null || examAssignmentRepository == null) {
            return "Chức năng tra cứu bài kiểm tra tạm thời không khả dụng.";
        }
        List<Exam> exams = new ArrayList<>(examRepository.findAllByTeacher_Username(teacher.getUsername()));
        if (exams.isEmpty()) {
            return "Thầy/Cô hiện chưa có đề thi hoặc bài kiểm tra nào trên hệ thống.\n"
                    + "Để giao bài kiểm tra cho học sinh:\n"
                    + "1. Tạo đề thi mới trong **Ngân hàng đề thi** (hoặc tải lên từ PDF).\n"
                    + "2. Bấm **Xuất bản** và chọn **Giao đề** cho lớp học kèm thời gian mở/đóng.\n"
                    + "[👉 Tạo đề thi mới](/teacher/exams/create) | [👉 Mở ngân hàng đề thi](/teacher/exams)";
        }
        exams.sort(newestExamComparator());

        List<Long> examIds = exams.stream().map(Exam::getId).filter(Objects::nonNull).toList();
        List<ExamAssignment> rawAssignments = examIds.isEmpty()
                ? Collections.emptyList()
                : examAssignmentRepository.findAllByExam_IdIn(examIds);
        List<ExamAssignment> assignments = rawAssignments != null ? new ArrayList<>(rawAssignments) : new ArrayList<>();

        if (assignments.isEmpty()) {
            StringBuilder emptySb = new StringBuilder(
                    "Thầy/Cô hiện chưa giao đợt thi chính thức nào cho lớp học, nhưng đang có "
                            + exams.size() + " đề thi trong ngân hàng đề thi (đang soạn hoặc chưa giao):\n");
            int limit = 0;
            for (Exam e : exams) {
                if (limit++ >= 10) break;
                emptySb.append("- Đề thi: **").append(e.getTitle()).append("**")
                        .append(" (Mã: `").append(e.getCode()).append("`")
                        .append(", Trạng thái: ").append(formatExamStatus(e.getStatus()))
                        .append(", Chưa giao) -> [👉 Xem chi tiết đề thi](/teacher/exams/").append(e.getId()).append(")\n");
            }
            emptySb.append("[👉 Mở ngân hàng đề thi](/teacher/exams)\n");
            return emptySb.toString();
        }

        assignments.sort(newestAssignmentComparator());
        StringBuilder sb = new StringBuilder("Danh sách bài kiểm tra / đợt thi Thầy/Cô đã giao:\n");
        int count = 0;
        Set<Long> assignedExamIds = new HashSet<>();
        for (ExamAssignment a : assignments) {
            if (a.getExam() != null && a.getExam().getId() != null) {
                assignedExamIds.add(a.getExam().getId());
            }
            if (count++ >= 15) continue;
            String examTitle = a.getExam() != null ? a.getExam().getTitle() : "Bài thi";
            Long examId = a.getExam() != null ? a.getExam().getId() : null;
            Long assignmentId = a.getId();
            String open = a.getOpenTime() != null ? a.getOpenTime().format(DATE_TIME_FORMATTER) : "Ngay bây giờ";
            String close = a.getCloseTime() != null ? a.getCloseTime().format(DATE_TIME_FORMATTER) : "Không giới hạn";
            sb.append("- Bài kiểm tra: **").append(examTitle).append("**")
                    .append(" (Bắt đầu: ").append(open)
                    .append(", Kết thúc: ").append(close)
                    .append(", Trạng thái: ").append(formatAssignmentStatus(a.getStatus()))
                    .append(")");
            if (examId != null && examId > 0) {
                if (assignmentId != null && assignmentId > 0) {
                    sb.append(" -> [👉 Quản lý bài kiểm tra](/teacher/exams/").append(examId)
                            .append("/assignments/").append(assignmentId).append(")")
                            .append(" | [👉 Xem chi tiết đề thi](/teacher/exams/").append(examId).append(")");
                } else {
                    sb.append(" -> [👉 Xem chi tiết đề thi](/teacher/exams/").append(examId).append(")");
                }
            } else {
                sb.append(" -> [👉 Mở ngân hàng đề thi](/teacher/exams)");
            }
            sb.append("\n");
        }

        List<Exam> unassignedExams = exams.stream()
                .filter(e -> e.getId() != null && !assignedExamIds.contains(e.getId()))
                .toList();
        if (!unassignedExams.isEmpty()) {
            sb.append("\nCác đề thi khác chưa giao / đang soạn (").append(unassignedExams.size()).append(" đề):\n");
            int draftCount = 0;
            for (Exam e : unassignedExams) {
                if (draftCount++ >= 5) break;
                sb.append("- **").append(e.getTitle()).append("**")
                        .append(" (").append(formatExamStatus(e.getStatus())).append(")")
                        .append(" -> [👉 Xem chi tiết đề thi](/teacher/exams/").append(e.getId()).append(")\n");
            }
        }
        return sb.toString();
    }

    private Map<Long, Long> countAssignmentsByExamId(List<Exam> exams) {
        if (examAssignmentRepository == null || exams.isEmpty()) {
            return Collections.emptyMap();
        }
        List<Long> examIds = exams.stream().map(Exam::getId).filter(Objects::nonNull).toList();
        if (examIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<ExamAssignment> assignments = examAssignmentRepository.findAllByExam_IdIn(examIds);
        if (assignments == null || assignments.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, Long> counts = new HashMap<>();
        for (ExamAssignment assignment : assignments) {
            if (assignment.getExam() != null && assignment.getExam().getId() != null) {
                counts.merge(assignment.getExam().getId(), 1L, Long::sum);
            }
        }
        return counts;
    }

    private Comparator<Exam> newestExamComparator() {
        return Comparator
                .comparing(Exam::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(Exam::getId, Comparator.nullsLast(Comparator.reverseOrder()));
    }

    private Comparator<ExamAssignment> newestAssignmentComparator() {
        return Comparator
                .comparing((ExamAssignment a) -> a.getCreatedAt() != null ? a.getCreatedAt() : a.getOpenTime(),
                        Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(ExamAssignment::getId, Comparator.nullsLast(Comparator.reverseOrder()));
    }

    private String formatExamStatus(ExamStatus status) {
        if (status == null) return "Đang soạn (Nháp)";
        return switch (status) {
            case DRAFT -> "Đang soạn (Nháp)";
            case PUBLISHED -> "Đã xuất bản";
            case CLOSED -> "Đã đóng";
        };
    }

    private String formatAssignmentStatus(ExamAssignmentStatus status) {
        if (status == null) return "Đang mở";
        return switch (status) {
            case DRAFT -> "Bản nháp";
            case SCHEDULED -> "Đã lên lịch";
            case OPEN -> "Đang mở";
            case CLOSED -> "Đã đóng";
        };
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
            if (cOpt.get().getStatus() == ClassroomStatus.ARCHIVED) {
                return "Lớp học **" + cOpt.get().getName() + "** hiện đang ở trạng thái lưu trữ, không thể mở phiên điểm danh mới.";
            }
            targetClass = cOpt.get();
        } else {
            List<Classroom> teacherClasses = classroomRepository.findAllByTeacher_Id(teacher.getId()).stream()
                    .filter(c -> c.getStatus() != ClassroomStatus.ARCHIVED)
                    .toList();
            if (teacherClasses.isEmpty()) {
                return "Thầy/Cô hiện chưa phụ trách lớp học đang hoạt động nào để mở điểm danh.\n"
                        + "Hãy tạo lớp học trước khi mở phiên điểm danh:\n"
                        + "[👉 Tạo / Quản lý lớp học](/teacher/classes)";
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

        if (teacherEntitlementService != null && attendanceRepository != null) {
            try {
                long usedDates = attendanceRepository.countDistinctDatesByTeacherId(teacher.getId());
                teacherEntitlementService.requireAttendanceCapacity(teacher.getId(), usedDates);
            } catch (ResponseStatusException ex) {
                return (ex.getReason() != null ? ex.getReason() : "Đã đạt giới hạn 5 phiên điểm danh của gói miễn phí.")
                        + "\n[👉 Nâng cấp VIP & Point](/teacher/billing)";
            }
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
        boolean fallbackAllClasses = false;
        List<HomeworkDtos.Assignment> assignments;
        try {
            assignments = homeworkReadService.listForTeacher(teacher.getUsername(), classId);
        } catch (RuntimeException ex) {
            if (classId != null) {
                log.warn("Không thể lọc bài tập theo classId={}, chuyển sang lấy toàn bộ bài tập của giáo viên {}: {}",
                        classId, teacher.getUsername(), ex.getMessage());
                classId = null;
                fallbackAllClasses = true;
                assignments = homeworkReadService.listForTeacher(teacher.getUsername(), null);
            } else {
                throw ex;
            }
        }

        if (assignments == null || assignments.isEmpty()) {
            StringBuilder emptySb = new StringBuilder();
            emptySb.append("Thầy/Cô hiện chưa giao bài tập về nhà nào")
                    .append(classId != null ? " cho lớp này." : " trong mục Bài tập.")
                    .append("\nHướng dẫn giao bài tập mới trên FrogH:\n")
                    .append("1. Vào mục **Bài tập** -> bấm **Tạo bài tập**.\n")
                    .append("2. Nhập tiêu đề, nội dung/tệp đính kèm, hạn nộp và chọn lớp hoặc học sinh nhận bài.\n")
                    .append("3. Bấm **Giao bài tập** để hệ thống gửi thông báo cho học sinh.\n")
                    .append("[👉 Tạo bài tập mới](/teacher/homework/create) | [👉 Mở trang Quản lý bài tập](/teacher/homework)\n");
            if (classId == null && examRepository != null && examAssignmentRepository != null) {
                String examAssignmentsSummary = runInTransaction(() -> executeGetTeacherAssignments(teacher));
                if (!examAssignmentsSummary.contains("chưa có đề thi") && !examAssignmentsSummary.contains("chưa giao đợt thi")) {
                    emptySb.append("\nLưu ý (các bài kiểm tra / đợt thi đã giao thuộc mục Đề thi):\n").append(examAssignmentsSummary);
                }
            }
            return emptySb.toString();
        }

        Map<Long, String> classNameById = resolveTeacherClassNames(teacher);
        StringBuilder sb = new StringBuilder(
                fallbackAllClasses
                        ? "Không tìm thấy lớp học được chỉ định, dưới đây là toàn bộ bài tập về nhà Thầy/Cô đã giao (tổng " + assignments.size() + " bài):\n"
                        : "Danh sách bài tập về nhà Thầy/Cô đã giao (tổng " + assignments.size() + " bài):\n");
        int count = 0;
        for (HomeworkDtos.Assignment hw : assignments) {
            if (count++ >= 15) break;
            String due = hw.dueAt() != null ? hw.dueAt().format(DATE_TIME_FORMATTER) : "Không giới hạn";
            String scope = formatHomeworkTargetScope(hw, classNameById);
            String statusText = formatHomeworkStatus(hw.status());
            sb.append("- Bài tập: **").append(hw.title()).append("**")
                    .append(" (Môn: ").append(hw.subjectName() != null ? hw.subjectName() : "Chưa rõ")
                    .append(", Giao cho: ").append(scope)
                    .append(", Hạn nộp: ").append(due)
                    .append(", Trạng thái: ").append(statusText)
                    .append(", Đã nộp: ").append(hw.submittedCount()).append("/").append(hw.recipientCount())
                    .append(", Đã chấm: ").append(hw.gradedCount()).append(")")
                    .append(" -> [👉 Chấm bài: ").append(hw.title()).append("](/teacher/homework/").append(hw.id()).append(")\n");
        }
        if (classId != null) {
            sb.append("-> [👉 Quản lý bài tập của lớp](/teacher/classes/").append(classId).append("/homework)\n");
        } else {
            sb.append("-> [👉 Mở danh sách bài tập đã giao](/teacher/homework)\n");
        }
        return sb.toString();
    }

    private Map<Long, String> resolveTeacherClassNames(User teacher) {
        if (classroomRepository == null || teacher == null || teacher.getId() == null) {
            return Collections.emptyMap();
        }
        List<Classroom> classes = classroomRepository.findAllByTeacher_Id(teacher.getId());
        if (classes == null || classes.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, String> map = new HashMap<>();
        for (Classroom c : classes) {
            if (c.getId() != null && c.getName() != null) {
                map.put(c.getId(), c.getName());
            }
        }
        return map;
    }

    private String formatHomeworkTargetScope(HomeworkDtos.Assignment hw, Map<Long, String> classNameById) {
        if ("ALL".equalsIgnoreCase(hw.assignmentType())) {
            return "Tất cả lớp đang dạy";
        }
        if (hw.classIds() != null && !hw.classIds().isEmpty()) {
            List<String> names = hw.classIds().stream()
                    .map(id -> classNameById.getOrDefault(id, "Lớp #" + id))
                    .toList();
            return String.join(", ", names);
        }
        if ("STUDENT".equalsIgnoreCase(hw.assignmentType())) {
            int studentCount = hw.studentIds() != null ? hw.studentIds().size() : hw.recipientCount();
            return studentCount + " học sinh";
        }
        return "Theo lớp";
    }

    private String formatHomeworkStatus(String status) {
        if (status == null || "OPEN".equalsIgnoreCase(status) || "PUBLISHED".equalsIgnoreCase(status)) {
            return "Đang mở";
        }
        if ("CLOSED".equalsIgnoreCase(status)) {
            return "Đã đóng";
        }
        return status;
    }

    private String executeGetTeacherMaterials(User teacher, String argumentsJson) {
        if (materialService == null) {
            return "Chức năng tra cứu tài liệu tạm thời không khả dụng.";
        }
        Long classId = extractLong(argumentsJson, "classId");
        boolean fallbackAll = false;
        List<MaterialDocumentResponse> materials;
        if (classId != null) {
            try {
                materials = materialService.getClassDocuments(classId, teacher.getUsername());
            } catch (RuntimeException ex) {
                log.warn("Không thể lọc tài liệu theo classId={}, chuyển sang lấy toàn bộ kho tài liệu của {}: {}",
                        classId, teacher.getUsername(), ex.getMessage());
                classId = null;
                fallbackAll = true;
                materials = materialService.getTeacherDocuments(teacher.getUsername());
            }
        } else {
            materials = materialService.getTeacherDocuments(teacher.getUsername());
        }

        if (materials == null || materials.isEmpty()) {
            return "Thầy/Cô hiện chưa tải lên tài liệu học tập nào"
                    + (classId != null ? " cho lớp này." : " trong Kho tài liệu.")
                    + "\nHướng dẫn đăng tài liệu trên FrogH:\n"
                    + "1. Vào mục **Tài liệu** -> bấm **Đăng tài liệu**.\n"
                    + "2. Nhập tiêu đề, ghi chú (nếu cần), chọn tệp (hỗ trợ PDF, Word, PowerPoint, Excel, TXT, ZIP; tối đa 10 MB/tệp).\n"
                    + "3. Chọn phạm vi phân phối (**Tất cả học sinh**, **Theo lớp** hoặc **Từng học sinh**) và bấm lưu.\n"
                    + "[👉 Mở Kho tài liệu](/teacher/materials)"
                    + (classId != null ? " | [👉 Tài liệu của lớp](/teacher/classes/" + classId + "/materials)\n" : "\n");
        }

        Map<Long, String> classNameById = resolveTeacherClassNames(teacher);
        StringBuilder sb = new StringBuilder(
                fallbackAll
                        ? "Không tìm thấy lớp được chỉ định, dưới đây là toàn bộ tài liệu trong Kho tài liệu của Thầy/Cô (tổng " + materials.size() + " tài liệu):\n"
                        : "Danh sách tài liệu học tập của Thầy/Cô (tổng " + materials.size() + " tài liệu):\n");
        int count = 0;
        for (MaterialDocumentResponse doc : materials) {
            if (count++ >= 15) break;
            String title = doc.getTitle() != null && !doc.getTitle().isBlank() ? doc.getTitle() : doc.getFileName();
            String fileName = doc.getFileName() != null ? doc.getFileName() : "Tệp đính kèm";
            String sizeText = formatFileSize(doc.getFileSize());
            String scope = formatMaterialTargetScope(doc, classNameById);
            String created = doc.getCreatedAt() != null ? doc.getCreatedAt().format(DATE_TIME_FORMATTER) : "Chưa rõ";
            sb.append("- Tài liệu: **").append(title).append("**")
                    .append(" (Tệp: `").append(fileName).append("`")
                    .append(sizeText != null ? ", " + sizeText : "")
                    .append(", Phân phối: ").append(scope)
                    .append(", Đăng lúc: ").append(created).append(")\n");
        }
        if (classId != null) {
            sb.append("-> [👉 Mở tab Tài liệu của lớp](/teacher/classes/").append(classId).append("/materials) | [👉 Mở Kho tài liệu](/teacher/materials)\n");
        } else {
            sb.append("-> [👉 Mở Kho tài liệu](/teacher/materials)\n");
        }
        return sb.toString();
    }

    private String formatMaterialTargetScope(MaterialDocumentResponse doc, Map<Long, String> classNameById) {
        String targetType = doc.getTargetType();
        if ("ALL".equalsIgnoreCase(targetType)) {
            if (doc.getExcludedClassIds() != null && !doc.getExcludedClassIds().isEmpty()) {
                return "Tất cả lớp (trừ " + doc.getExcludedClassIds().size() + " lớp)";
            }
            return "Tất cả học sinh";
        }
        if ("CLASS".equalsIgnoreCase(targetType) && doc.getClassIds() != null && !doc.getClassIds().isEmpty()) {
            List<String> names = doc.getClassIds().stream()
                    .map(id -> classNameById.getOrDefault(id, "Lớp #" + id))
                    .toList();
            return String.join(", ", names);
        }
        if ("STUDENT".equalsIgnoreCase(targetType)) {
            int studentCount = doc.getStudentIds() != null ? doc.getStudentIds().size() : 0;
            return studentCount + " học sinh";
        }
        return "Theo phân phối";
    }

    private String formatFileSize(Long fileSize) {
        if (fileSize == null || fileSize <= 0) {
            return null;
        }
        if (fileSize >= 1024L * 1024L) {
            return String.format(Locale.US, "%.1f MB", fileSize / (1024.0 * 1024.0));
        }
        if (fileSize >= 1024L) {
            return Math.max(1L, Math.round(fileSize / 1024.0)) + " KB";
        }
        return fileSize + " B";
    }

    private String executeGetStudentClasses(User student) {
        if (classStudentRepository == null) return "Chức năng tra cứu lớp học tạm thời không khả dụng.";
        List<ClassroomSummaryProjection> summaries = classStudentRepository.findClassSummariesByStudentId(student.getId());
        if (summaries.isEmpty()) {
            return "Bạn hiện chưa tham gia lớp học nào trên hệ thống FrogH.\n"
                    + "Hướng dẫn tham gia lớp học:\n"
                    + "1. Xin **Mã lớp học** (Class Code) từ Giáo viên bộ môn của bạn.\n"
                    + "2. Mở trang **Lớp học** -> nhập mã lớp vào ô tham gia lớp và xác nhận.\n"
                    + "[👉 Tham gia lớp học ngay](/student/classes)";
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
            return "Bạn hiện chưa có bài thi hoặc bài kiểm tra nào được giao.\n"
                    + "Hướng dẫn:\n"
                    + "- Khi Giáo viên xuất bản và giao đề cho lớp của bạn, bài kiểm tra sẽ xuất hiện ở mục **Bài thi**.\n"
                    + "- Nếu bạn chưa vào lớp học nào, hãy xin mã lớp từ Giáo viên để tham gia lớp trước nhé.\n"
                    + "[👉 Xem mục Bài thi](/student/exams) | [👉 Kiểm tra Lớp học của tôi](/student/classes)";
        }
        StringBuilder sb = new StringBuilder("Danh sách bài thi / bài kiểm tra được giao cho bạn:\n");
        for (StudentExamResponse item : examPage.items()) {
            String close = item.closeTime() != null ? item.closeTime().format(DATE_TIME_FORMATTER) : "Không giới hạn";
            String duration = item.timeLimit() != null ? item.timeLimit() + " phút" : "Không giới hạn";
            String examTarget = (item.assignmentId() != null && item.assignmentId() > 0)
                    ? "/student/exams/" + item.assignmentId()
                    : "/student/exams";
            sb.append("- Bài thi: **").append(item.title()).append("**")
                    .append(" (Mã: `").append(item.code()).append("`")
                    .append(", Trạng thái: ").append(item.attemptStatus() != null ? item.attemptStatus() : "Chưa làm")
                    .append(", Thời gian: ").append(duration)
                    .append(", Hạn nộp: ").append(close)
                    .append(") -> [👉 Vào phòng thi](").append(examTarget).append(")\n");
        }
        return sb.toString();
    }

    private String executeGetStudentGrades(User student) {
        if (studentExamReadService == null) return "Chức năng tra cứu điểm số tạm thời không khả dụng.";
        StudentGradesResponse grades = studentExamReadService.grades(student.getUsername(), null, null, null, null, "", null, "newest", 0, 10, false);
        if (grades == null || grades.items() == null || grades.items().isEmpty()) {
            return "Bạn hiện chưa có điểm bài thi nào được ghi nhận trên hệ thống.\n"
                    + "Hướng dẫn:\n"
                    + "- Vào mục **Bài thi** để hoàn thành và nộp các bài kiểm tra được giao (hoặc chờ Giáo viên chấm điểm đối với phần tự luận).\n"
                    + "[👉 Xem Bảng điểm](/student/grades) | [👉 Vào mục Bài thi](/student/exams)";
        }
        StringBuilder sb = new StringBuilder("Kết quả điểm số các bài kiểm tra gần nhất của bạn:\n");
        for (StudentGradesResponse.Item item : grades.items()) {
            String scoreStr = item.score() != null ? item.score().toString() + "/10" : "Chờ chấm";
            String time = item.submittedAt() != null ? item.submittedAt().format(DATE_TIME_FORMATTER) : "Chưa rõ";
            String resultTarget = (item.attemptId() != null && item.attemptId() > 0)
                    ? "/student/exam-attempts/" + item.attemptId() + "/result"
                    : "/student/grades";
            sb.append("- Bài thi: **").append(item.title()).append("**")
                    .append(" - Điểm số: **").append(scoreStr).append("**")
                    .append(" (Môn: ").append(item.subjectName() != null ? item.subjectName() : "Chưa rõ")
                    .append(", Nộp lúc: ").append(time).append(")")
                    .append(" -> [👉 Xem chi tiết kết quả](").append(resultTarget).append(")\n");
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
            return "Bạn hiện chưa có dữ liệu điểm danh nào được ghi nhận trên hệ thống.\n"
                    + "Hướng dẫn điểm danh:\n"
                    + "1. Đảm bảo bạn đã tham gia lớp học bằng mã lớp từ Giáo viên.\n"
                    + "2. Khi Giáo viên mở buổi điểm danh, vào mục **Điểm danh** và nhập **mã OTP 6 chữ số** trước khi hết hạn.\n"
                    + "[👉 Mở trang Điểm danh](/student/attendance) | [👉 Lớp học của tôi](/student/classes)";
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
        boolean fallbackAllClasses = false;
        List<HomeworkDtos.StudentAssignment> homeworks;
        try {
            homeworks = homeworkReadService.listForStudent(student.getUsername(), classId);
        } catch (RuntimeException ex) {
            if (classId != null) {
                log.warn("Không thể lọc bài tập học sinh theo classId={}, chuyển sang lấy toàn bộ bài tập của {}: {}",
                        classId, student.getUsername(), ex.getMessage());
                classId = null;
                fallbackAllClasses = true;
                homeworks = homeworkReadService.listForStudent(student.getUsername(), null);
            } else {
                throw ex;
            }
        }
        if (homeworks == null || homeworks.isEmpty()) {
            return "Bạn hiện không có bài tập về nhà nào cần nộp.\n"
                    + "Hướng dẫn:\n"
                    + "- Các bài tập mới do Giáo viên giao sẽ tự động hiển thị trong mục **Bài tập** kèm hạn nộp.\n"
                    + "- Nếu bạn chưa tham gia lớp nào, hãy vào mục **Lớp học** để nhập mã lớp do Giáo viên cung cấp.\n"
                    + "[👉 Mở mục Bài tập](/student/homework) | [👉 Lớp học của tôi](/student/classes)";
        }

        StringBuilder sb = new StringBuilder(
                fallbackAllClasses
                        ? "Dưới đây là toàn bộ bài tập về nhà được giao cho bạn (tổng " + homeworks.size() + " bài):\n"
                        : "Danh sách bài tập về nhà được giao cho bạn (tổng " + homeworks.size() + " bài):\n");
        int count = 0;
        for (HomeworkDtos.StudentAssignment h : homeworks) {
            if (count++ >= 15) break;
            HomeworkDtos.Assignment a = h.assignment();
            String title = a != null ? a.title() : "Bài tập";
            String subjectName = (a != null && a.subjectName() != null) ? a.subjectName() : "Chưa rõ";
            String due = (a != null && a.dueAt() != null) ? a.dueAt().format(DATE_TIME_FORMATTER) : "Không giới hạn";
            String status = "Chưa nộp";
            if ("SUBMITTED".equalsIgnoreCase(h.submissionStatus())) {
                status = "Đã nộp bài";
            } else if ("GRADED".equalsIgnoreCase(h.submissionStatus())) {
                status = "Đã chấm: " + (h.score() != null ? h.score() + " điểm" : "");
            } else if ("REOPENED".equalsIgnoreCase(h.submissionStatus())) {
                status = "Được mở lại (Cần nộp lại)";
            }

            long assignmentId = a != null ? a.id() : 0;
            String hwTarget = assignmentId > 0 ? "/student/homework/" + assignmentId : "/student/homework";
            sb.append("- Bài tập: **").append(title).append("**")
                    .append(" (Môn: ").append(subjectName)
                    .append(", Hạn nộp: ").append(due)
                    .append(", Trạng thái bài: ").append(formatHomeworkStatus(a != null ? a.status() : null))
                    .append(", Nộp bài: ").append(status).append(")")
                    .append(" -> [👉 Làm bài tập: ").append(title).append("](").append(hwTarget).append(")\n");
        }
        if (classId != null) {
            sb.append("-> [👉 Vào lớp học](/student/classes/").append(classId).append(")\n");
        } else {
            sb.append("-> [👉 Xem tất cả bài tập](/student/homework)\n");
        }
        return sb.toString();
    }

    private String executeGetStudentMaterials(User student, String argumentsJson) {
        if (materialService == null || classStudentRepository == null) {
            return "Chức năng tra cứu tài liệu tạm thời không khả dụng.";
        }
        List<ClassroomSummaryProjection> enrolledClasses = classStudentRepository.findClassSummariesByStudentId(student.getId());
        if (enrolledClasses == null || enrolledClasses.isEmpty()) {
            return "Bạn hiện chưa tham gia lớp học nào nên chưa có tài liệu học tập được chia sẻ.\n"
                    + "Hướng dẫn xem tài liệu trên FrogH:\n"
                    + "1. Vào mục **Lớp học** và nhập **Mã lớp** từ Giáo viên để tham gia lớp.\n"
                    + "2. Mở lớp học đó và chọn tab **Tài liệu** để xem và tải về các tệp học tập.\n"
                    + "[👉 Tham gia lớp học ngay](/student/classes)";
        }

        Long requestedClassId = extractLong(argumentsJson, "classId");
        List<ClassroomSummaryProjection> targetClasses = enrolledClasses;
        boolean fallbackAll = false;
        if (requestedClassId != null) {
            List<ClassroomSummaryProjection> matched = enrolledClasses.stream()
                    .filter(c -> Objects.equals(c.getId(), requestedClassId))
                    .toList();
            if (!matched.isEmpty()) {
                targetClasses = matched;
            } else {
                fallbackAll = true;
            }
        }

        StringBuilder sb = new StringBuilder(
                fallbackAll
                        ? "Không tìm thấy lớp được chỉ định trong danh sách lớp bạn tham gia, dưới đây là tài liệu từ tất cả lớp của bạn:\n"
                        : "Danh sách tài liệu học tập được chia sẻ trong các lớp của bạn:\n");
        int totalDocs = 0;
        int listedDocs = 0;
        for (ClassroomSummaryProjection classroom : targetClasses) {
            List<MaterialDocumentResponse> docs;
            try {
                docs = materialService.getClassDocuments(classroom.getId(), student.getUsername());
            } catch (RuntimeException ex) {
                log.warn("Bỏ qua đọc tài liệu lớp {} cho {}: {}", classroom.getId(), student.getUsername(), ex.getMessage());
                continue;
            }
            if (docs == null || docs.isEmpty()) {
                continue;
            }
            totalDocs += docs.size();
            if (listedDocs >= 15) {
                continue;
            }
            sb.append("\n**Lớp ").append(classroom.getName()).append("** -> [👉 Mở tab Tài liệu của lớp](/student/classes/")
                    .append(classroom.getId()).append(")\n");
            for (MaterialDocumentResponse doc : docs) {
                if (listedDocs++ >= 15) break;
                String title = doc.getTitle() != null && !doc.getTitle().isBlank() ? doc.getTitle() : doc.getFileName();
                String fileName = doc.getFileName() != null ? doc.getFileName() : "Tệp đính kèm";
                String sizeText = formatFileSize(doc.getFileSize());
                String created = doc.getCreatedAt() != null ? doc.getCreatedAt().format(DATE_TIME_FORMATTER) : "Chưa rõ";
                sb.append("- **").append(title).append("** (Tệp: `").append(fileName).append("`")
                        .append(sizeText != null ? ", " + sizeText : "")
                        .append(", Đăng lúc: ").append(created).append(")\n");
            }
        }

        if (totalDocs == 0) {
            return "Hiện chưa có tài liệu học tập nào được Giáo viên chia sẻ trong lớp của bạn.\n"
                    + "Hướng dẫn xem tài liệu trên FrogH:\n"
                    + "- Mở lớp học của bạn -> chọn tab **Tài liệu** để xem và tải về các tệp bài giảng (PDF, Word, PPT, Excel...) khi Giáo viên đăng tải.\n"
                    + "[👉 Mở Lớp học của tôi](/student/classes)";
        }
        sb.append("\nTổng cộng tìm thấy ").append(totalDocs).append(" tài liệu khả dụng. Hãy mở lớp tương ứng và chọn tab **Tài liệu** để xem hoặc tải tệp.");
        return sb.toString();
    }

    private Long extractLong(String argumentsJson, String fieldName) {
        if (argumentsJson == null || argumentsJson.isBlank() || "{}".equals(argumentsJson.trim())) {
            return null;
        }
        try {
            JsonNode root = objectMapper.readTree(argumentsJson);
            if (!root.has(fieldName)) {
                return null;
            }
            JsonNode valueNode = root.get(fieldName);
            if (valueNode == null || valueNode.isNull() || valueNode.isBoolean() || valueNode.isContainerNode()) {
                return null;
            }
            long parsed;
            if (valueNode.isNumber()) {
                parsed = valueNode.asLong();
            } else {
                String raw = valueNode.asText("").trim();
                if (raw.isEmpty() || "null".equalsIgnoreCase(raw) || "none".equalsIgnoreCase(raw)
                        || "all".equalsIgnoreCase(raw) || "undefined".equalsIgnoreCase(raw)) {
                    return null;
                }
                parsed = Long.parseLong(raw);
            }
            return parsed > 0 ? parsed : null;
        } catch (Exception ignored) {
            return null;
        }
    }

    private Integer extractInteger(String argumentsJson, String fieldName) {
        Long value = extractLong(argumentsJson, fieldName);
        if (value == null || value > Integer.MAX_VALUE) {
            return null;
        }
        return value.intValue();
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
