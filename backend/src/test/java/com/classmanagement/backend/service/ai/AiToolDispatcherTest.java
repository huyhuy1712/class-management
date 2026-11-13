package com.classmanagement.backend.service.ai;

import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.entity.Lesson;
import com.classmanagement.backend.entity.Subject;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.ClassroomStatus;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.repository.LessonRepository;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import com.classmanagement.backend.repository.classroom.ClassroomRepository;
import com.classmanagement.backend.repository.projection.ClassroomSummaryProjection;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class AiToolDispatcherTest {

    private List<Classroom> mockTeacherClassrooms = new ArrayList<>();
    private List<Lesson> mockLessons = new ArrayList<>();
    private List<ClassroomSummaryProjection> mockStudentSummaries = new ArrayList<>();

    private AiToolDispatcher aiToolDispatcher;
    private User teacherUser;
    private User studentUser;

    @BeforeEach
    void setUp() {
        mockTeacherClassrooms.clear();
        mockLessons.clear();
        mockStudentSummaries.clear();

        ClassroomRepository classroomRepo = createProxy(ClassroomRepository.class, (method, args) -> {
            if ("findAllByTeacher_Id".equals(method.getName())) {
                return mockTeacherClassrooms;
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
            return null;
        });

        aiToolDispatcher = new AiToolDispatcher(classroomRepo, classStudentRepo, lessonRepo);

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
    @DisplayName("getToolsForRole: Giáo viên nhận 2 công cụ tra cứu lớp học và lịch dạy")
    void getToolsForRole_teacher() {
        List<Map<String, Object>> tools = aiToolDispatcher.getToolsForRole("TEACHER");
        assertEquals(2, tools.size());

        @SuppressWarnings("unchecked")
        Map<String, Object> fn1 = (Map<String, Object>) tools.get(0).get("function");
        @SuppressWarnings("unchecked")
        Map<String, Object> fn2 = (Map<String, Object>) tools.get(1).get("function");

        assertEquals("getTeacherClasses", fn1.get("name"));
        assertEquals("getTeacherTodaySchedule", fn2.get("name"));
    }

    @Test
    @DisplayName("getToolsForRole: Học sinh nhận 1 công cụ tra cứu lớp học")
    void getToolsForRole_student() {
        List<Map<String, Object>> tools = aiToolDispatcher.getToolsForRole("STUDENT");
        assertEquals(1, tools.size());

        @SuppressWarnings("unchecked")
        Map<String, Object> fn1 = (Map<String, Object>) tools.get(0).get("function");
        assertEquals("getStudentClasses", fn1.get("name"));
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
    @DisplayName("executeGetTeacherClasses: Trả về danh sách lớp học khi giáo viên có lớp")
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
        assertTrue(result.contains("2025-2026"));
    }

    @Test
    @DisplayName("executeGetTeacherClasses: Trả về thông báo trống khi giáo viên chưa có lớp")
    void executeGetTeacherClasses_empty() {
        String result = aiToolDispatcher.executeTool("getTeacherClasses", "{}", teacherUser);
        assertTrue(result.contains("chưa được phân công phụ trách lớp học nào"));
    }

    @Test
    @DisplayName("executeGetTeacherTodaySchedule: Trả về lịch dạy trong ngày hôm nay của giáo viên")
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
        assertTrue(result.contains("Ôn tập Đạo hàm"));
        assertTrue(result.contains("08:00 - 09:30"));
    }

    @Test
    @DisplayName("executeGetTeacherTodaySchedule: Trả về thông báo không có tiết dạy khi ngày hôm nay trống")
    void executeGetTeacherTodaySchedule_noLessons() {
        Classroom classroom = Classroom.builder()
                .id(100L)
                .name("Lớp 12A1")
                .teacher(teacherUser)
                .build();

        mockTeacherClassrooms.add(classroom);

        String result = aiToolDispatcher.executeTool("getTeacherTodaySchedule", "{}", teacherUser);
        assertTrue(result.contains("không có lịch dạy nào trên hệ thống"));
    }

    @Test
    @DisplayName("executeGetStudentClasses: Trả về danh sách lớp học của học sinh")
    void executeGetStudentClasses_success() {
        ClassroomSummaryProjection summary = createProxy(ClassroomSummaryProjection.class, (method, args) -> switch (method.getName()) {
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
        assertTrue(result.contains("Thầy Hoàng"));
        assertTrue(result.contains("2025-2026"));
    }

    @Test
    @DisplayName("executeGetStudentClasses: Trả về thông báo khi học sinh chưa tham gia lớp nào")
    void executeGetStudentClasses_empty() {
        String result = aiToolDispatcher.executeTool("getStudentClasses", "{}", studentUser);
        assertTrue(result.contains("chưa tham gia lớp học nào"));
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
