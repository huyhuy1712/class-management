package com.classmanagement.backend.service.ai;

import com.classmanagement.backend.dto.exam.StudentExamResponse;
import com.classmanagement.backend.dto.exam.StudentGradesResponse;
import com.classmanagement.backend.dto.homework.HomeworkDtos;
import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.repository.AttendanceRepository;
import com.classmanagement.backend.repository.LessonRepository;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import com.classmanagement.backend.repository.classroom.ClassroomRepository;
import com.classmanagement.backend.repository.exam.ExamAssignmentRepository;
import com.classmanagement.backend.repository.exam.ExamRepository;
import com.classmanagement.backend.repository.projection.ClassroomSummaryProjection;
import com.classmanagement.backend.service.exam.StudentExamReadService;
import com.classmanagement.backend.service.homework.queries.HomeworkReadService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class AiToolDispatcherTest {

    private final List<Classroom> mockTeacherClassrooms = new ArrayList<>();
    private final List<Lesson> mockLessons = new ArrayList<>();
    private final List<ClassroomSummaryProjection> mockStudentSummaries = new ArrayList<>();
    private final List<Exam> mockTeacherExams = new ArrayList<>();
    private final List<ExamAssignment> mockTeacherAssignments = new ArrayList<>();
    private final List<Attendance> mockAttendances = new ArrayList<>();
    private final List<HomeworkDtos.Assignment> mockTeacherHomeworks = new ArrayList<>();
    private final List<HomeworkDtos.StudentAssignment> mockStudentHomeworks = new ArrayList<>();

    private StudentExamResponse.Page mockStudentExamPage;
    private StudentGradesResponse mockStudentGradesResponse;

    private AiToolDispatcher aiToolDispatcher;
    private User teacherUser;
    private User studentUser;

    @BeforeEach
    void setUp() {
        mockTeacherClassrooms.clear();
        mockLessons.clear();
        mockStudentSummaries.clear();
        mockTeacherExams.clear();
        mockTeacherAssignments.clear();
        mockAttendances.clear();
        mockTeacherHomeworks.clear();
        mockStudentHomeworks.clear();
        mockStudentExamPage = null;
        mockStudentGradesResponse = null;

        ClassroomRepository classroomRepo = createProxy(ClassroomRepository.class, (method, args) -> {
            if ("findAllByTeacher_Id".equals(method.getName())) {
                return mockTeacherClassrooms;
            }
            if ("findById".equals(method.getName()) && args != null && args.length > 0) {
                Long id = (Long) args[0];
                return mockTeacherClassrooms.stream().filter(c -> c.getId().equals(id)).findFirst();
            }
            return null;
        });

        ClassStudentRepository classStudentRepo = createProxy(ClassStudentRepository.class, (method, args) -> {
            if ("findClassSummariesByStudentId".equals(method.getName())) {
                return mockStudentSummaries;
            }
            return null;
        });

        LessonRepository lessonRepo = createProxy(LessonRepository.class, (method, args) -> {
            if ("findAllByClassroom_IdAndLessonDateOrderByStartTimeAsc".equals(method.getName())) {
                return mockLessons;
            }
            if ("save".equals(method.getName()) && args != null && args.length > 0) {
                Lesson l = (Lesson) args[0];
                mockLessons.add(l);
                return l;
            }
            return null;
        });

        ExamRepository examRepo = createProxy(ExamRepository.class, (method, args) -> {
            if ("findAllByTeacher_Username".equals(method.getName())) {
                return mockTeacherExams;
            }
            return null;
        });

        ExamAssignmentRepository examAssignmentRepo = createProxy(ExamAssignmentRepository.class, (method, args) -> {
            if ("findAllByExam_IdIn".equals(method.getName())) {
                return mockTeacherAssignments;
            }
            return null;
        });

        StudentExamReadService studentExamService = new StudentExamReadService(null, null) {
            @Override
            public StudentExamResponse.Page list(String username, int page, int size, String query, Long classId, LocalDate date, String sort) {
                return mockStudentExamPage;
            }

            @Override
            public StudentGradesResponse grades(String username, Long classId, Long subjectId, LocalDate from, LocalDate to, String query, String status, String sort, int page, int size, boolean includeCharts) {
                return mockStudentGradesResponse;
            }
        };

        AttendanceRepository attendanceRepo = createProxy(AttendanceRepository.class, (method, args) -> {
            if ("findAllByClassroomIdAndDate".equals(method.getName())
                    || "findAllByClassroom_IdOrderByDateDesc".equals(method.getName())
                    || "findAllByStudent_Id".equals(method.getName())
                    || "findAllByClassroom_IdAndStudent_IdOrderByDateDesc".equals(method.getName())) {
                return mockAttendances;
            }
            return null;
        });

        HomeworkReadService homeworkReadService = new HomeworkReadService(null, null, null) {
            @Override
            public List<HomeworkDtos.Assignment> listForTeacher(String username, Long classId) {
                return mockTeacherHomeworks;
            }

            @Override
            public List<HomeworkDtos.StudentAssignment> listForStudent(String username, Long classId) {
                return mockStudentHomeworks;
            }
        };

        aiToolDispatcher = new AiToolDispatcher(
                classroomRepo,
                classStudentRepo,
                lessonRepo,
                examRepo,
                examAssignmentRepo,
                studentExamService,
                attendanceRepo,
                homeworkReadService
        );

        teacherUser = User.builder()
                .id(1L)
                .username("teacher1")
                .fullName("Thầy Nguyễn Văn A")
                .role(UserRole.TEACHER)
                .build();

        studentUser = User.builder()
                .id(2L)
                .username("student1")
                .fullName("Trần Thị B")
                .role(UserRole.STUDENT)
                .build();
    }

    @Test
    @DisplayName("getToolsForRole: Giáo viên nhận 7 công cụ đầy đủ (lớp, lịch dạy, đề thi, bài giao, mở điểm danh, thống kê điểm danh, bài tập)")
    void getToolsForRole_teacher() {
        List<Map<String, Object>> tools = aiToolDispatcher.getToolsForRole("TEACHER");
        assertEquals(7, tools.size());

        Set<String> toolNames = new HashSet<>();
        for (Map<String, Object> tool : tools) {
            @SuppressWarnings("unchecked")
            Map<String, Object> fn = (Map<String, Object>) tool.get("function");
            toolNames.add((String) fn.get("name"));
        }

        assertTrue(toolNames.contains("getTeacherClasses"));
        assertTrue(toolNames.contains("getTeacherTodaySchedule"));
        assertTrue(toolNames.contains("getTeacherExams"));
        assertTrue(toolNames.contains("getTeacherAssignments"));
        assertTrue(toolNames.contains("openQuickAttendanceSession"));
        assertTrue(toolNames.contains("getTeacherClassAttendance"));
        assertTrue(toolNames.contains("getTeacherHomeworks"));
    }

    @Test
    @DisplayName("getToolsForRole: Học sinh nhận 5 công cụ (lớp học, bài thi, bảng điểm, chuyên cần, bài tập về nhà)")
    void getToolsForRole_student() {
        List<Map<String, Object>> tools = aiToolDispatcher.getToolsForRole("STUDENT");
        assertEquals(5, tools.size());

        Set<String> toolNames = new HashSet<>();
        for (Map<String, Object> tool : tools) {
            @SuppressWarnings("unchecked")
            Map<String, Object> fn = (Map<String, Object>) tool.get("function");
            toolNames.add((String) fn.get("name"));
        }

        assertTrue(toolNames.contains("getStudentClasses"));
        assertTrue(toolNames.contains("getStudentExams"));
        assertTrue(toolNames.contains("getStudentGrades"));
        assertTrue(toolNames.contains("getStudentAttendanceSummary"));
        assertTrue(toolNames.contains("getStudentHomeworks"));
    }

    @Test
    @DisplayName("getToolsForRole: Khách hoặc vai trò khác không nhận được công cụ nào")
    void getToolsForRole_guest() {
        List<Map<String, Object>> tools = aiToolDispatcher.getToolsForRole("GUEST");
        assertTrue(tools.isEmpty());
    }

    @Test
    @DisplayName("executeTool: Trả về lỗi khi currentUser là null")
    void executeTool_nullUser() {
        String result = aiToolDispatcher.executeTool("getTeacherClasses", "{}", null);
        assertTrue(result.contains("Không thể xác thực"));
    }

    @Test
    @DisplayName("executeTool: Báo lỗi khi tên tool không tồn tại")
    void executeTool_unknownTool() {
        String result = aiToolDispatcher.executeTool("unknownFunction", "{}", teacherUser);
        assertTrue(result.contains("Không tìm thấy công cụ"));
    }

    @Test
    @DisplayName("executeGetTeacherClasses: Trả về danh sách lớp học kèm nút đường dẫn chi tiết")
    void executeGetTeacherClasses_success() {
        Subject math = Subject.builder().id(10L).name("Toán Học").code("MATH").build();
        Classroom classroom = Classroom.builder()
                .id(100L)
                .name("Lớp 12A1")
                .code("CLS12A1")
                .subject(math)
                .teacher(teacherUser)
                .academicYear("2025-2026")
                .status(ClassroomStatus.ACTIVE)
                .build();

        mockTeacherClassrooms.add(classroom);

        String result = aiToolDispatcher.executeTool("getTeacherClasses", "{}", teacherUser);
        assertNotNull(result);
        assertTrue(result.contains("Lớp 12A1"));
        assertTrue(result.contains("CLS12A1"));
        assertTrue(result.contains("Toán Học"));
        assertTrue(result.contains("[👉 Đến lớp học](/teacher/classes/100)"));
    }

    @Test
    @DisplayName("executeGetTeacherClasses: Trả về thông báo trống khi giáo viên chưa có lớp")
    void executeGetTeacherClasses_empty() {
        String result = aiToolDispatcher.executeTool("getTeacherClasses", "{}", teacherUser);
        assertTrue(result.contains("chưa được phân công phụ trách lớp học nào"));
    }

    @Test
    @DisplayName("executeGetTeacherTodaySchedule: Trả về lịch dạy trong ngày kèm nút đường dẫn vào lớp")
    void executeGetTeacherTodaySchedule_hasLessons() {
        Subject math = Subject.builder().id(10L).name("Toán Học").build();
        Classroom classroom = Classroom.builder()
                .id(100L)
                .name("Lớp 12A1")
                .subject(math)
                .teacher(teacherUser)
                .build();

        LocalDate today = LocalDate.now();
        Lesson lesson = Lesson.builder()
                .id(501L)
                .classroom(classroom)
                .title("Ôn tập Đạo hàm & Khảo sát hàm số")
                .lessonDate(today)
                .attendanceCode("ATT123")
                .startTime(LocalDateTime.of(today.getYear(), today.getMonth(), today.getDayOfMonth(), 8, 0))
                .lateTime(LocalDateTime.of(today.getYear(), today.getMonth(), today.getDayOfMonth(), 8, 15))
                .endTime(LocalDateTime.of(today.getYear(), today.getMonth(), today.getDayOfMonth(), 9, 30))
                .createdAt(LocalDateTime.now())
                .build();

        mockTeacherClassrooms.add(classroom);
        mockLessons.add(lesson);

        String result = aiToolDispatcher.executeTool("getTeacherTodaySchedule", "{}", teacherUser);
        assertNotNull(result);
        assertTrue(result.contains("Lịch dạy hôm nay"));
        assertTrue(result.contains("Lớp 12A1"));
        assertTrue(result.contains("[👉 Đến lớp](/teacher/classes/100)"));
    }

    @Test
    @DisplayName("executeGetTeacherExams: Trả về danh sách đề thi kèm nút xem chi tiết")
    void executeGetTeacherExams_success() {
        Subject math = Subject.builder().id(10L).name("Toán Học").build();
        Exam exam = Exam.builder()
                .id(200L)
                .title("Đề kiểm tra 15 phút Đạo hàm")
                .code("EXAM-MATH-15")
                .subject(math)
                .teacher(teacherUser)
                .timeLimit(15)
                .status(ExamStatus.PUBLISHED)
                .build();

        mockTeacherExams.add(exam);

        String result = aiToolDispatcher.executeTool("getTeacherExams", "{}", teacherUser);
        assertNotNull(result);
        assertTrue(result.contains("Đề kiểm tra 15 phút Đạo hàm"));
        assertTrue(result.contains("EXAM-MATH-15"));
        assertTrue(result.contains("[👉 Xem chi tiết đề thi](/teacher/exams/200)"));
    }

    @Test
    @DisplayName("executeGetTeacherExams: Thông báo khi giáo viên chưa có đề thi nào")
    void executeGetTeacherExams_empty() {
        String result = aiToolDispatcher.executeTool("getTeacherExams", "{}", teacherUser);
        assertTrue(result.contains("chưa tạo đề thi nào"));
    }

    @Test
    @DisplayName("executeGetTeacherAssignments: Trả về danh sách bài kiểm tra đã giao kèm nút quản lý")
    void executeGetTeacherAssignments_success() {
        Exam exam = Exam.builder()
                .id(200L)
                .title("Đề kiểm tra 15 phút Đạo hàm")
                .teacher(teacherUser)
                .build();
        mockTeacherExams.add(exam);

        ExamAssignment assignment = ExamAssignment.builder()
                .id(300L)
                .exam(exam)
                .status(ExamAssignmentStatus.OPEN)
                .openTime(LocalDateTime.of(2026, 11, 14, 8, 0))
                .closeTime(LocalDateTime.of(2026, 11, 14, 22, 0))
                .build();
        mockTeacherAssignments.add(assignment);

        String result = aiToolDispatcher.executeTool("getTeacherAssignments", "{}", teacherUser);
        assertNotNull(result);
        assertTrue(result.contains("Đề kiểm tra 15 phút Đạo hàm"));
        assertTrue(result.contains("[👉 Quản lý bài kiểm tra](/teacher/exams/200/assignments/300)"));
    }

    @Test
    @DisplayName("openQuickAttendanceSession: Mở phiên điểm danh nhanh thành công khi chưa có buổi học hôm nay")
    void openQuickAttendanceSession_newSession() {
        Classroom classroom = Classroom.builder()
                .id(100L)
                .name("Lớp 12A1")
                .code("CLS12A1")
                .teacher(teacherUser)
                .build();
        mockTeacherClassrooms.add(classroom);

        String result = aiToolDispatcher.executeTool("openQuickAttendanceSession", "{\"classId\": 100, \"durationMinutes\": 20}", teacherUser);
        assertNotNull(result);
        assertTrue(result.contains("Đã mở phiên điểm danh nhanh thành công cho lớp **Lớp 12A1**"));
        assertTrue(result.contains("Mã điểm danh:"));
        assertTrue(result.contains("20 phút"));
        assertTrue(result.contains("[👉 Mở phòng điểm danh lớp Lớp 12A1](/teacher/classes/100/attendance)"));
    }

    @Test
    @DisplayName("openQuickAttendanceSession: Trả về thông tin phiên đã tồn tại nếu hôm nay đã mở điểm danh")
    void openQuickAttendanceSession_existingSession() {
        Classroom classroom = Classroom.builder()
                .id(100L)
                .name("Lớp 12A1")
                .code("CLS12A1")
                .teacher(teacherUser)
                .build();
        mockTeacherClassrooms.add(classroom);

        Lesson existing = Lesson.builder()
                .id(888L)
                .classroom(classroom)
                .title("Buổi học hôm nay")
                .lessonDate(LocalDate.now())
                .attendanceCode("999888")
                .startTime(LocalDateTime.now())
                .lateTime(LocalDateTime.now().plusMinutes(15))
                .endTime(LocalDateTime.now().plusHours(2))
                .build();
        mockLessons.add(existing);

        String result = aiToolDispatcher.executeTool("openQuickAttendanceSession", "{\"classId\": 100}", teacherUser);
        assertNotNull(result);
        assertTrue(result.contains("đã được kích hoạt trước đó"));
        assertTrue(result.contains("999888"));
        assertTrue(result.contains("[👉 Mở phòng điểm danh lớp Lớp 12A1](/teacher/classes/100/attendance)"));
    }

    @Test
    @DisplayName("getTeacherClassAttendance: Trả về thống kê điểm danh của lớp học")
    void getTeacherClassAttendance_success() {
        Classroom classroom = Classroom.builder()
                .id(100L)
                .name("Lớp 12A1")
                .code("CLS12A1")
                .teacher(teacherUser)
                .build();
        mockTeacherClassrooms.add(classroom);

        Attendance a1 = Attendance.builder().id(1L).classroom(classroom).date(LocalDate.now()).status(AttendanceStatus.PRESENT).build();
        Attendance a2 = Attendance.builder().id(2L).classroom(classroom).date(LocalDate.now()).status(AttendanceStatus.LATE).build();
        Attendance a3 = Attendance.builder().id(3L).classroom(classroom).date(LocalDate.now()).status(AttendanceStatus.ABSENT).build();
        mockAttendances.addAll(List.of(a1, a2, a3));

        String result = aiToolDispatcher.executeTool("getTeacherClassAttendance", "{\"classId\": 100}", teacherUser);
        assertNotNull(result);
        assertTrue(result.contains("Tình hình điểm danh lớp **Lớp 12A1**"));
        assertTrue(result.contains("Có mặt: 1 học sinh"));
        assertTrue(result.contains("Đi muộn: 1 học sinh"));
        assertTrue(result.contains("Vắng mặt: 1 học sinh"));
        assertTrue(result.contains("[👉 Quản lý chi tiết điểm danh lớp Lớp 12A1](/teacher/classes/100/attendance)"));
    }

    @Test
    @DisplayName("getTeacherHomeworks: Trả về danh sách bài tập đã giao kèm thống kê nộp bài")
    void getTeacherHomeworks_success() {
        HomeworkDtos.Assignment hw = new HomeworkDtos.Assignment(
                55L,
                "Bài tập Đại số chương 2",
                "Giải các bài tập trong SGK",
                10L,
                "Toán Học",
                "12",
                "HOMEWORK",
                "CLASS",
                LocalDateTime.of(2026, 11, 20, 23, 59),
                BigDecimal.valueOf(10),
                "PUBLISHED",
                null, null, null, null,
                35, 30, 25,
                LocalDateTime.now(),
                List.of(100L),
                List.of()
        );
        mockTeacherHomeworks.add(hw);

        String result = aiToolDispatcher.executeTool("getTeacherHomeworks", "{\"classId\": 100}", teacherUser);
        assertNotNull(result);
        assertTrue(result.contains("Bài tập Đại số chương 2"));
        assertTrue(result.contains("Đã nộp: 30/35"));
        assertTrue(result.contains("Đã chấm: 25"));
        assertTrue(result.contains("[👉 Chấm bài: Bài tập Đại số chương 2](/teacher/homework/55)"));
        assertTrue(result.contains("[👉 Quản lý bài tập của lớp](/teacher/classes/100/homework)"));
    }

    @Test
    @DisplayName("executeGetStudentClasses: Trả về danh sách lớp học kèm nút vào lớp")
    void executeGetStudentClasses_success() {
        ClassroomSummaryProjection summary = createProxy(ClassroomSummaryProjection.class, (method, args) -> switch (method.getName()) {
            case "getId" -> 105L;
            case "getName" -> "Lớp 10B2";
            case "getSubjectName" -> "Vật Lý";
            case "getTeacherName" -> "Thầy Hoàng";
            case "getAcademicYear" -> "2025-2026";
            default -> null;
        });

        mockStudentSummaries.add(summary);

        String result = aiToolDispatcher.executeTool("getStudentClasses", "{}", studentUser);
        assertNotNull(result);
        assertTrue(result.contains("Lớp 10B2"));
        assertTrue(result.contains("Vật Lý"));
        assertTrue(result.contains("[👉 Đến lớp học](/student/classes/105)"));
    }

    @Test
    @DisplayName("executeGetStudentExams: Trả về danh sách bài thi được giao kèm nút vào làm bài")
    void executeGetStudentExams_success() {
        StudentExamResponse examItem = new StudentExamResponse(
                401L,
                200L,
                "Bài kiểm tra 1 tiết Đại số",
                "EXAM-MATH-45",
                "Mô tả bài thi",
                "CLASS",
                List.of(),
                LocalDateTime.of(2026, 11, 14, 8, 0),
                LocalDateTime.of(2026, 11, 14, 20, 0),
                45,
                1,
                0,
                null,
                "NOT_STARTED",
                true,
                false,
                null
        );

        mockStudentExamPage = new StudentExamResponse.Page(
                List.of(examItem),
                0,
                10,
                1,
                new StudentExamResponse.Stats(0, 1, 0)
        );

        String result = aiToolDispatcher.executeTool("getStudentExams", "{}", studentUser);
        assertNotNull(result);
        assertTrue(result.contains("Bài kiểm tra 1 tiết Đại số"));
        assertTrue(result.contains("[👉 Vào phòng thi](/student/exams/401)"));
    }

    @Test
    @DisplayName("executeGetStudentGrades: Trả về bảng điểm kèm nút xem chi tiết kết quả")
    void executeGetStudentGrades_success() {
        StudentGradesResponse.Item gradeItem = new StudentGradesResponse.Item(
                999L,
                401L,
                "Bài kiểm tra 1 tiết Đại số",
                "EXAM-MATH-45",
                10L,
                "Toán Học",
                List.of(),
                1,
                "GRADED",
                true,
                BigDecimal.valueOf(9.5),
                OffsetDateTime.now(),
                2400,
                "Làm bài rất tốt!"
        );

        mockStudentGradesResponse = new StudentGradesResponse(
                null,
                null,
                null,
                List.of(gradeItem),
                0,
                10,
                1
        );

        String result = aiToolDispatcher.executeTool("getStudentGrades", "{}", studentUser);
        assertNotNull(result);
        assertTrue(result.contains("Bài kiểm tra 1 tiết Đại số"));
        assertTrue(result.contains("9.5/10"));
        assertTrue(result.contains("[👉 Xem chi tiết kết quả](/student/exam-attempts/999/result)"));
    }

    @Test
    @DisplayName("getStudentAttendanceSummary: Trả về thống kê chuyên cần và lịch sử điểm danh của học sinh")
    void getStudentAttendanceSummary_success() {
        Classroom classroom = Classroom.builder().id(100L).name("Lớp 12A1").build();
        Attendance a1 = Attendance.builder().id(1L).classroom(classroom).date(LocalDate.of(2026, 11, 1)).status(AttendanceStatus.PRESENT).build();
        Attendance a2 = Attendance.builder().id(2L).classroom(classroom).date(LocalDate.of(2026, 11, 2)).status(AttendanceStatus.LATE).note("Kẹt xe").build();
        Attendance a3 = Attendance.builder().id(3L).classroom(classroom).date(LocalDate.of(2026, 11, 3)).status(AttendanceStatus.PRESENT).build();
        Attendance a4 = Attendance.builder().id(4L).classroom(classroom).date(LocalDate.of(2026, 11, 4)).status(AttendanceStatus.ABSENT).note("Ốm sốt").build();
        mockAttendances.addAll(List.of(a1, a2, a3, a4));

        String result = aiToolDispatcher.executeTool("getStudentAttendanceSummary", "{}", studentUser);
        assertNotNull(result);
        assertTrue(result.contains("Tổng số buổi đã điểm danh: 4"));
        assertTrue(result.contains("Có mặt đúng giờ: 2 buổi"));
        assertTrue(result.contains("Đi muộn: 1 buổi"));
        assertTrue(result.contains("Vắng mặt: 1 buổi"));
        assertTrue(result.contains("Tỷ lệ chuyên cần: **75.0%**"));
        assertTrue(result.contains("[👉 Xem lịch sử điểm danh đầy đủ](/student/attendance)"));
    }

    @Test
    @DisplayName("getStudentHomeworks: Trả về danh sách bài tập về nhà được giao cho học sinh")
    void getStudentHomeworks_success() {
        HomeworkDtos.Assignment a = new HomeworkDtos.Assignment(
                77L,
                "Bài tập Hóa học Hữu cơ",
                "Làm bài 1, 2, 3",
                20L,
                "Hóa Học",
                "12",
                "HOMEWORK",
                "CLASS",
                LocalDateTime.of(2026, 11, 18, 20, 0),
                BigDecimal.valueOf(10),
                "PUBLISHED",
                null, null, null, null,
                30, 20, 15,
                LocalDateTime.now(),
                List.of(100L),
                List.of()
        );

        HomeworkDtos.StudentAssignment sa = new HomeworkDtos.StudentAssignment(
                a,
                "SUBMITTED",
                "Em đã hoàn thành bài tập",
                List.of(),
                List.of(),
                null, null,
                LocalDateTime.now(),
                null,
                null
        );

        mockStudentHomeworks.add(sa);

        String result = aiToolDispatcher.executeTool("getStudentHomeworks", "{\"classId\": 100}", studentUser);
        assertNotNull(result);
        assertTrue(result.contains("Bài tập Hóa học Hữu cơ"));
        assertTrue(result.contains("Đã nộp bài"));
        assertTrue(result.contains("[👉 Làm bài tập: Bài tập Hóa học Hữu cơ](/student/homework/77)"));
        assertTrue(result.contains("[👉 Vào lớp học](/student/classes/100)"));
    }

    @FunctionalInterface
    interface InvocationHandlerFunction {
        Object invoke(java.lang.reflect.Method method, Object[] args) throws Throwable;
    }

    @SuppressWarnings("unchecked")
    private <T> T createProxy(Class<T> iface, InvocationHandlerFunction fn) {
        return (T) Proxy.newProxyInstance(iface.getClassLoader(), new Class<?>[]{iface}, (proxy, method, args) -> fn.invoke(method, args));
    }
}
