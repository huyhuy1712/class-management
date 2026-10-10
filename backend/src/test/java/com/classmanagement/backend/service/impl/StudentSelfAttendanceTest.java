package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.exception.LateAttendanceReasonRequiredException;
import com.classmanagement.backend.repository.*;
import com.classmanagement.backend.repository.classroom.*;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Proxy;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class StudentSelfAttendanceTest {
    private static <T> T repository(Class<T> type, java.util.function.BiFunction<String, Object[], Object> handler) {
        return type.cast(Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type},
                (proxy, method, args) -> handler.apply(method.getName(), args)));
    }

    @Test void validatesPasswordAndRequiresReasonBeforeSavingLateAttendance() {
        var now = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        var student = User.builder().id(3L).username("student").role(UserRole.STUDENT).build();
        var classroom = Classroom.builder().id(2L).status(ClassroomStatus.ACTIVE).build();
        var lesson = Lesson.builder().id(8L).classroom(classroom).lessonDate(now.toLocalDate())
                .startTime(now.minusHours(1)).lateTime(now.plusMinutes(30)).endTime(now.plusHours(1)).attendanceCode("secret").build();
        List<Attendance> saved = new ArrayList<>();
        var service = new AttendanceServiceImpl(
                repository(AttendanceRepository.class, (method, args) -> {
                    if (method.startsWith("exists")) return false;
                    var attendance = (Attendance) args[0];
                    attendance.setId(9L); saved.add(attendance); return attendance;
                }),
                repository(ClassroomRepository.class, (method, args) -> Optional.of(classroom)),
                repository(LessonRepository.class, (method, args) -> List.of(lesson)),
                repository(UserRepository.class, (method, args) -> Optional.of(student)),
                repository(ClassStudentRepository.class, (method, args) -> true), null, null);
        assertThrows(IllegalArgumentException.class, () -> service.attendAsStudent(2L, "student", "wrong", null));
        assertTrue(saved.isEmpty());
        assertEquals(AttendanceStatus.PRESENT, service.attendAsStudent(2L, "student", "secret", null).get(0).getStatus());
        lesson.setLateTime(now.minusMinutes(1));
        assertThrows(LateAttendanceReasonRequiredException.class, () -> service.attendAsStudent(2L, "student", "secret", null));
        assertEquals(1, saved.size());
        var late = service.attendAsStudent(2L, "student", "secret", "  Kẹt xe  ").get(0);
        assertEquals(AttendanceStatus.LATE, late.getStatus());
        assertEquals("Kẹt xe", late.getNote());
        lesson.setEndTime(now.minusSeconds(1));
        assertThrows(IllegalArgumentException.class, () -> service.attendAsStudent(2L, "student", "secret", "Kẹt xe"));
        classroom.setStatus(ClassroomStatus.ARCHIVED);
        assertThrows(IllegalStateException.class, () -> service.attendAsStudent(2L, "student", "secret", null));
    }
}
