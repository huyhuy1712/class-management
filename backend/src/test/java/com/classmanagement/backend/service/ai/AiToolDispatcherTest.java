package com.classmanagement.backend.service.ai;

import com.classmanagement.backend.dto.exam.StudentExamResponse;
import com.classmanagement.backend.dto.exam.StudentGradesResponse;
import com.classmanagement.backend.dto.homework.HomeworkDtos;
import com.classmanagement.backend.dto.material.MaterialDocumentResponse;
import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.repository.AttendanceRepository;
import com.classmanagement.backend.repository.LessonRepository;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import com.classmanagement.backend.repository.classroom.ClassroomRepository;
import com.classmanagement.backend.repository.exam.ExamAssignmentRepository;
import com.classmanagement.backend.repository.exam.ExamRepository;
import com.classmanagement.backend.repository.projection.ClassroomSummaryProjection;
import com.classmanagement.backend.service.MaterialService;
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
    private final List<MaterialDocumentResponse> mockTeacherMaterials = new ArrayList<>();
    private final Map<Long, List<MaterialDocumentResponse>> mockClassMaterials = new HashMap<>();

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
        mockTeacherMaterials.clear();
        mockClassMaterials.clear();
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
                if (classId != null && classId <= 0) {
                    throw new ResourceNotFoundException("Không tìm thấy lớp đang hoạt động");
                }
                if (classId != null && classId == 999L) {
                    throw new ResourceNotFoundException("Không tìm thấy lớp đang hoạt động");
                }
                return mockTeacherHomeworks;
            }

            @Override
            public List<HomeworkDtos.StudentAssignment> listForStudent(String username, Long classId) {
                if (classId != null && classId <= 0) {
                    throw new IllegalArgumentException("Lớp học không hợp lệ");
                }
                if (classId != null && classId == 999L) {
                    throw new ResourceNotFoundException("Không tìm thấy lớp đang hoạt động");
                }
                return mockStudentHomeworks;
            }
        };

        MaterialService materialService = createProxy(MaterialService.class, (method, args) -> {
            if ("getTeacherDocuments".equals(method.getName())) {
                return mockTeacherMaterials;
            }
            if ("getClassDocuments".equals(method.getName()) && args != null && args.length > 0) {
                Long cid = (Long) args[0];
                if (cid == null || cid <= 0 || cid == 999L) {
                    throw new ResourceNotFoundException("Không tìm thấy lớp học");
                }
                return mockClassMaterials.getOrDefault(cid, List.of());
            }
            return null;
        });

        aiToolDispatcher = new AiToolDispatcher(
                classroomRepo,
                classStudentRepo,
                lessonRepo,
                examRepo,
                examAssignmentRepo,
                studentExamService,
                attendanceRepo,
                homeworkReadService,
                materialService
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
    @DisplayName("getToolsForRole: Giáo viên nhận 8 công cụ đầy đủ (bao gồm Tài liệu chỉ-đọc, KHÔNG có VIP/Lịch sử)")
    void getToolsForRole_teacher() {
        List<Map<String, Object>> tools = aiToolDispatcher.getToolsForRole("TEACHER");
        assertEquals(8, tools.size());

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
        assertTrue(toolNames.contains("getTeacherMaterials"));
        assertTrue(toolNames.stream().noneMatch(name ->
                name.toLowerCase(Locale.ROOT).contains("vip")
                        || name.toLowerCase(Locale.ROOT).contains("point")
                        || name.toLowerCase(Locale.ROOT).contains("billing")
                        || name.toLowerCase(Locale.ROOT).contains("history")
        ));
    }

    @Test
    @DisplayName("getToolsForRole: Học sinh nhận 6 công cụ (bao gồm Tài liệu chỉ-đọc, KHÔNG có VIP/Lịch sử)")
    void getToolsForRole_student() {
        List<Map<String, Object>> tools = aiToolDispatcher.getToolsForRole("STUDENT");
        assertEquals(6, tools.size());

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
        assertTrue(toolNames.contains("getStudentMaterials"));
        assertTrue(toolNames.stream().noneMatch(name ->
                name.toLowerCase(Locale.ROOT).contains("vip")
                        || name.toLowerCase(Locale.ROOT).contains("point")
                        || name.toLowerCase(Locale.ROOT).contains("billing")
                        || name.toLowerCase(Locale.ROOT).contains("history")
        ));
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
        assertTrue(result.contains("Đã xuất bản"));
        assertTrue(result.contains("Chưa giao"));
        assertTrue(result.contains("[👉 Xem chi tiết đề thi](/teacher/exams/200)"));
    }

    @Test
    @DisplayName("executeGetTeacherExams: Bao gồm cả đề đang soạn (DRAFT) chưa giao và đề đã giao theo thứ tự mới nhất")
    void executeGetTeacherExams_includesDraftAndAssignedNewestFirst() {
        Subject math = Subject.builder().id(10L).name("Toán Học").build();
        Exam oldPublished = Exam.builder()
                .id(201L)
                .title("Đề giữa kì toán")
                .code("EX-10-RGBMOZ")
                .subject(math)
                .teacher(teacherUser)
                .timeLimit(45)
                .status(ExamStatus.PUBLISHED)
                .createdAt(LocalDateTime.of(2026, 11, 13, 17, 21))
                .build();
        Exam newDraft = Exam.builder()
                .id(202L)
                .title("Đề ôn tập chương mới (Đang soạn)")
                .code("EX-10-DRAFT1")
                .subject(math)
                .teacher(teacherUser)
                .status(ExamStatus.DRAFT)
                .createdAt(LocalDateTime.of(2026, 11, 14, 18, 0))
                .build();

        mockTeacherExams.add(oldPublished);
        mockTeacherExams.add(newDraft);
        mockTeacherAssignments.add(ExamAssignment.builder()
                .id(301L)
                .exam(oldPublished)
                .status(ExamAssignmentStatus.OPEN)
                .build());

        String result = aiToolDispatcher.executeTool("getTeacherExams", "{}", teacherUser);
        assertNotNull(result);
        assertTrue(result.contains("Đang soạn (Nháp)"));
        assertTrue(result.contains("Chưa giao"));
        assertTrue(result.contains("Đã giao 1 đợt"));
        assertTrue(result.contains("[👉 Xem chi tiết đề thi](/teacher/exams/202)"));
        assertTrue(result.contains("[👉 Xem chi tiết đề thi](/teacher/exams/201)"));
        // Đề mới hơn phải đứng trước đề cũ hơn
        assertTrue(result.indexOf("Đề ôn tập chương mới") < result.indexOf("Đề giữa kì toán"));
    }

    @Test
    @DisplayName("executeGetTeacherExams: Thông báo khi giáo viên chưa có đề thi nào")
    void executeGetTeacherExams_empty() {
        String result = aiToolDispatcher.executeTool("getTeacherExams", "{}", teacherUser);
        assertTrue(result.contains("chưa tạo đề thi nào"));
    }

    @Test
    @DisplayName("executeGetTeacherAssignments: Trả về danh sách bài kiểm tra đã giao kèm đề chưa giao và nút quản lý")
    void executeGetTeacherAssignments_success() {
        Exam exam = Exam.builder()
                .id(200L)
                .title("Đề kiểm tra 15 phút Đạo hàm")
                .teacher(teacherUser)
                .status(ExamStatus.PUBLISHED)
                .build();
        Exam draftExam = Exam.builder()
                .id(205L)
                .title("Đề nháp chưa giao")
                .code("EX-DRAFT")
                .teacher(teacherUser)
                .status(ExamStatus.DRAFT)
                .build();
        mockTeacherExams.add(exam);
        mockTeacherExams.add(draftExam);

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
        assertTrue(result.contains("Đề nháp chưa giao"));
        assertTrue(result.contains("[👉 Xem chi tiết đề thi](/teacher/exams/205)"));
    }

    @Test
    @DisplayName("executeGetTeacherAssignments: Khi chưa giao đợt nào vẫn liệt kê đề đang soạn/chưa giao")
    void executeGetTeacherAssignments_noAssignmentsStillListsDrafts() {
        Exam draftExam = Exam.builder()
                .id(206L)
                .title("Đề kiểm tra đang soạn")
                .code("EX-206")
                .teacher(teacherUser)
                .status(ExamStatus.DRAFT)
                .build();
        mockTeacherExams.add(draftExam);

        String result = aiToolDispatcher.executeTool("getTeacherAssignments", "{}", teacherUser);
        assertNotNull(result);
        assertTrue(result.contains("Đề kiểm tra đang soạn"));
        assertTrue(result.contains("Đang soạn (Nháp)"));
        assertTrue(result.contains("[👉 Xem chi tiết đề thi](/teacher/exams/206)"));
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
    @DisplayName("getTeacherHomeworks: Đọc ổn định khi LLM truyền {}, null, 0, chuỗi rỗng hoặc classId không tồn tại")
    void getTeacherHomeworks_handlesInvalidOrNullClassId() {
        HomeworkDtos.Assignment hw = new HomeworkDtos.Assignment(
                56L,
                "Bài tập Hình học không gian",
                "Làm bài 1-5",
                10L,
                "Toán Học",
                "12",
                "HOMEWORK",
                "ALL",
                LocalDateTime.of(2026, 11, 22, 23, 59),
                BigDecimal.valueOf(10),
                "OPEN",
                null, null, null, null,
                40, 12, 5,
                LocalDateTime.now(),
                List.of(),
                List.of()
        );
        mockTeacherHomeworks.add(hw);

        for (String args : List.of("{}", "{\"classId\": null}", "{\"classId\": 0}", "{\"classId\": \"\"}", "{\"classId\": \"all\"}", "{\"classId\": 999}")) {
            String result = aiToolDispatcher.executeTool("getTeacherHomeworks", args, teacherUser);
            assertNotNull(result);
            assertTrue(result.contains("Bài tập Hình học không gian"), "Thất bại với args: " + args + " -> " + result);
            assertTrue(result.contains("[👉 Chấm bài: Bài tập Hình học không gian](/teacher/homework/56)"));
            assertFalse(result.contains("Đã xảy ra lỗi"), "Không được báo lỗi với args: " + args);
        }
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

    @Test
    @DisplayName("getStudentHomeworks: Xử lý REOPENED và classId null/0/không tồn tại không bị lỗi")
    void getStudentHomeworks_handlesReopenedAndInvalidClassId() {
        HomeworkDtos.Assignment a = new HomeworkDtos.Assignment(
                78L,
                "Bài tập Ngữ Văn nghị luận",
                "Viết đoạn văn 200 chữ",
                30L,
                "Ngữ Văn",
                "12",
                "HOMEWORK",
                "ALL",
                LocalDateTime.of(2026, 11, 25, 21, 0),
                BigDecimal.valueOf(10),
                "OPEN",
                null, null, null, null,
                30, 10, 5,
                LocalDateTime.now(),
                List.of(),
                List.of()
        );
        mockStudentHomeworks.add(new HomeworkDtos.StudentAssignment(
                a, "REOPENED", "Bài làm cũ", List.of(), List.of(),
                null, null, LocalDateTime.now(), null, null
        ));

        for (String args : List.of("{}", "{\"classId\": null}", "{\"classId\": 0}", "{\"classId\": 999}")) {
            String result = aiToolDispatcher.executeTool("getStudentHomeworks", args, studentUser);
            assertNotNull(result);
            assertTrue(result.contains("Bài tập Ngữ Văn nghị luận"));
            assertTrue(result.contains("Được mở lại (Cần nộp lại)"));
            assertTrue(result.contains("[👉 Làm bài tập: Bài tập Ngữ Văn nghị luận](/student/homework/78)"));
        }
    }

    @Test
    @DisplayName("RBAC Security: Cấm tuyệt đối Học sinh thực thi các công cụ dành riêng cho Giáo viên")
    void executeTool_rbacBlocksStudentFromTeacherTools() {
        // Giả lập lớp của giáo viên để đảm bảo openQuickAttendanceSession không thể ghi DB dù học sinh cố gọi
        mockTeacherClassrooms.add(Classroom.builder().id(100L).name("Lớp 12A1").teacher(studentUser).build());

        List<String> teacherTools = List.of(
                "getTeacherClasses",
                "getTeacherTodaySchedule",
                "getTeacherExams",
                "getTeacherAssignments",
                "openQuickAttendanceSession",
                "getTeacherClassAttendance",
                "getTeacherHomeworks",
                "getTeacherMaterials"
        );

        for (String tool : teacherTools) {
            String res = aiToolDispatcher.executeTool(tool, "{\"classId\": 100}", studentUser);
            assertNotNull(res);
            assertTrue(res.contains("Từ chối truy cập"), "Học sinh phải bị chặn ở tool: " + tool + ", nhận: " + res);
        }
        assertTrue(mockLessons.isEmpty(), "Không được tạo buổi học điểm danh khi học sinh gọi trái phép");
    }

    @Test
    @DisplayName("RBAC Security: Cấm Giáo viên hoặc tài khoản không hoạt động gọi công cụ sai vai trò")
    void executeTool_rbacBlocksWrongRoleAndInactiveUser() {
        List<String> studentTools = List.of(
                "getStudentClasses",
                "getStudentExams",
                "getStudentGrades",
                "getStudentAttendanceSummary",
                "getStudentHomeworks",
                "getStudentMaterials"
        );
        for (String tool : studentTools) {
            String res = aiToolDispatcher.executeTool(tool, "{}", teacherUser);
            assertTrue(res.contains("Từ chối truy cập"), "Giáo viên không được gọi tool học sinh: " + tool);
        }

        User bannedStudent = User.builder()
                .id(99L)
                .username("banned_hs")
                .role(UserRole.STUDENT)
                .status(UserStatus.BANNED)
                .build();
        String bannedRes = aiToolDispatcher.executeTool("getStudentClasses", "{}", bannedStudent);
        assertTrue(bannedRes.contains("Từ chối truy cập"));
    }

    @Test
    @DisplayName("getTeacherMaterials: Đọc dữ liệu tài liệu chỉ-đọc và hướng dẫn khi kho tài liệu rỗng")
    void getTeacherMaterials_successAndEmptyState() {
        String emptyRes = aiToolDispatcher.executeTool("getTeacherMaterials", "{}", teacherUser);
        assertTrue(emptyRes.contains("chưa tải lên tài liệu"));
        assertTrue(emptyRes.contains("[👉 Mở Kho tài liệu](/teacher/materials)"));

        mockTeacherClassrooms.add(Classroom.builder().id(100L).name("Toán 12A1").teacher(teacherUser).build());
        mockTeacherMaterials.add(MaterialDocumentResponse.builder()
                .id(11L)
                .title("Đề cương ôn tập Hình học")
                .fileName("de-cuong-hinh-12.pdf")
                .fileSize(2_097_152L)
                .targetType("CLASS")
                .classIds(List.of(100L))
                .createdAt(LocalDateTime.of(2026, 11, 15, 9, 30))
                .build());

        String res = aiToolDispatcher.executeTool("getTeacherMaterials", "{}", teacherUser);
        assertTrue(res.contains("Đề cương ôn tập Hình học"));
        assertTrue(res.contains("de-cuong-hinh-12.pdf"));
        assertTrue(res.contains("2.0 MB"));
        assertTrue(res.contains("Toán 12A1"));
        assertTrue(res.contains("[👉 Mở Kho tài liệu](/teacher/materials)"));
    }

    @Test
    @DisplayName("getStudentMaterials: Chỉ đọc tài liệu của các lớp học sinh tham gia và hướng dẫn khi trống")
    void getStudentMaterials_successAndEmptyState() {
        String noClassRes = aiToolDispatcher.executeTool("getStudentMaterials", "{}", studentUser);
        assertTrue(noClassRes.contains("chưa tham gia lớp học nào"));
        assertTrue(noClassRes.contains("[👉 Tham gia lớp học ngay](/student/classes)"));

        ClassroomSummaryProjection summary = createProxy(ClassroomSummaryProjection.class, (method, args) -> switch (method.getName()) {
            case "getId" -> 105L;
            case "getName" -> "Lớp 10B2";
            default -> null;
        });
        mockStudentSummaries.add(summary);

        String emptyDocsRes = aiToolDispatcher.executeTool("getStudentMaterials", "{}", studentUser);
        assertTrue(emptyDocsRes.contains("chưa có tài liệu học tập nào được Giáo viên chia sẻ"));
        assertTrue(emptyDocsRes.contains("[👉 Mở Lớp học của tôi](/student/classes)"));

        mockClassMaterials.put(105L, List.of(MaterialDocumentResponse.builder()
                .id(22L)
                .title("Slide Chương 3 - Động lực học")
                .fileName("chuong-3.pptx")
                .fileSize(512_000L)
                .targetType("CLASS")
                .classIds(List.of(105L))
                .createdAt(LocalDateTime.of(2026, 11, 15, 14, 0))
                .build()));

        String docsRes = aiToolDispatcher.executeTool("getStudentMaterials", "{}", studentUser);
        assertTrue(docsRes.contains("Lớp 10B2"));
        assertTrue(docsRes.contains("Slide Chương 3 - Động lực học"));
        assertTrue(docsRes.contains("chuong-3.pptx"));
        assertTrue(docsRes.contains("[👉 Mở tab Tài liệu của lớp](/student/classes/105)"));
    }

    @Test
    @DisplayName("Restricted Security: Từ chối mọi lời gọi công cụ liên quan VIP, Point, Billing hoặc Lịch sử")
    void executeTool_blocksVipBillingAndHistoryAccess() {
        List<String> forbiddenTools = List.of(
                "getTeacherVipPoints",
                "addVipPoints",
                "redeemVip",
                "claimMission",
                "getBillingInvoices",
                "createMomoOrder",
                "getTeacherHistory",
                "getStudentActivityLog"
        );
        for (String tool : forbiddenTools) {
            String teacherRes = aiToolDispatcher.executeTool(tool, "{}", teacherUser);
            assertTrue(teacherRes.contains("Từ chối truy cập"), "Phải chặn tool nhạy cảm cho GV: " + tool);
            String studentRes = aiToolDispatcher.executeTool(tool, "{}", studentUser);
            assertTrue(studentRes.contains("Từ chối truy cập"), "Phải chặn tool nhạy cảm cho HS: " + tool);
        }
    }

    @Test
    @DisplayName("Empty-State Guidance: Khi chưa có dữ liệu DB, trả về thông báo chính xác kèm hướng dẫn & nút tạo/tham gia")
    void executeTool_emptyStatesProvideAccurateGuidanceAndLinks() {
        String teacherClassesEmpty = aiToolDispatcher.executeTool("getTeacherClasses", "{}", teacherUser);
        assertTrue(teacherClassesEmpty.contains("chưa được phân công phụ trách lớp học nào"));
        assertTrue(teacherClassesEmpty.contains("[👉 Mở Quản lý lớp học](/teacher/classes)"));

        String teacherExamsEmpty = aiToolDispatcher.executeTool("getTeacherExams", "{}", teacherUser);
        assertTrue(teacherExamsEmpty.contains("chưa tạo đề thi nào"));
        assertTrue(teacherExamsEmpty.contains("/teacher/exams/create"));

        String teacherHomeworksEmpty = aiToolDispatcher.executeTool("getTeacherHomeworks", "{}", teacherUser);
        assertTrue(teacherHomeworksEmpty.contains("chưa giao bài tập về nhà nào"));
        assertTrue(teacherHomeworksEmpty.contains("/teacher/homework/create"));

        String studentClassesEmpty = aiToolDispatcher.executeTool("getStudentClasses", "{}", studentUser);
        assertTrue(studentClassesEmpty.contains("chưa tham gia lớp học nào"));
        assertTrue(studentClassesEmpty.contains("Mã lớp học"));
        assertTrue(studentClassesEmpty.contains("[👉 Tham gia lớp học ngay](/student/classes)"));

        String studentExamsEmpty = aiToolDispatcher.executeTool("getStudentExams", "{}", studentUser);
        assertTrue(studentExamsEmpty.contains("chưa có bài thi"));
        assertTrue(studentExamsEmpty.contains("/student/exams"));

        String studentGradesEmpty = aiToolDispatcher.executeTool("getStudentGrades", "{}", studentUser);
        assertTrue(studentGradesEmpty.contains("chưa có điểm bài thi"));
        assertTrue(studentGradesEmpty.contains("/student/grades"));

        String studentAttendanceEmpty = aiToolDispatcher.executeTool("getStudentAttendanceSummary", "{}", studentUser);
        assertTrue(studentAttendanceEmpty.contains("chưa có dữ liệu điểm danh"));
        assertTrue(studentAttendanceEmpty.contains("/student/attendance"));

        String studentHomeworksEmpty = aiToolDispatcher.executeTool("getStudentHomeworks", "{}", studentUser);
        assertTrue(studentHomeworksEmpty.contains("không có bài tập về nhà nào"));
        assertTrue(studentHomeworksEmpty.contains("/student/homework"));
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
