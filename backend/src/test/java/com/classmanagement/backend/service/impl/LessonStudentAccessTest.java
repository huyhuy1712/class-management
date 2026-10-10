package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.repository.*;
import com.classmanagement.backend.repository.classroom.*;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Proxy;
import java.time.LocalDate;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class LessonStudentAccessTest {
    private UserRole role = UserRole.STUDENT;
    private String username = "student";
    private boolean member = true;
    private int lessonQueries;
    private int membershipQueries;
    private final LocalDate date = LocalDate.of(2026, 10, 11);
    private final Classroom classroom = Classroom.builder().id(3L).name("Math")
            .teacher(User.builder().username("teacher").build()).build();
    private final Lesson lesson = Lesson.builder().id(1L).classroom(classroom).attendanceCode("secret")
            .lessonDate(date).startTime(date.atTime(1, 0)).endTime(date.atTime(15, 0)).build();

    @Test void memberCanReadTimesWithoutAttendanceCode() {
        var result = service().getLessonsByClassroomAndDate(3L, date, username);
        assertNull(result.getFirst().getAttendanceCode());
        assertEquals(lesson.getStartTime(), result.getFirst().getStartTime());
        assertEquals(lesson.getEndTime(), result.getFirst().getEndTime());
        assertEquals("secret", lesson.getAttendanceCode());
        assertEquals(1, membershipQueries);
        assertEquals(1, lessonQueries);
    }
    @Test void removedStudentCannotReadLessons() {
        member = false;
        assertThrows(IllegalStateException.class, () -> service().getLessonsByClassroomAndDate(3L, date, username));
        assertEquals(0, lessonQueries);
    }
    @Test void ownerStillReceivesAttendanceCode() {
        role = UserRole.TEACHER; username = "teacher";
        assertEquals("secret", service().getLessonsByClassroomAndDate(3L, date, username).getFirst().getAttendanceCode());
        assertEquals(0, membershipQueries);
    }
    @Test void otherTeacherCannotReadLessons() {
        role = UserRole.TEACHER; username = "other";
        assertThrows(IllegalStateException.class, () -> service().getLessonsByClassroomAndDate(3L, date, username));
        assertEquals(0, lessonQueries);
    }
    private LessonServiceImpl service() {
        return new LessonServiceImpl(repo(LessonRepository.class), repo(ClassroomRepository.class),
                repo(UserRepository.class), repo(ClassStudentRepository.class));
    }
    private <T> T repo(Class<T> type) {
        return type.cast(Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, (p,m,a) -> switch(m.getName()) {
            case "findById" -> Optional.of(classroom);
            case "findByUsername" -> Optional.of(User.builder().role(role).username(username).build());
            case "existsByClassroom_IdAndStudent_Username" -> {
                assertArrayEquals(new Object[]{3L, username}, a); membershipQueries++; yield member;
            }
            case "findAllByClassroom_IdAndLessonDateOrderByStartTimeAsc" -> {
                assertArrayEquals(new Object[]{3L, date}, a); lessonQueries++; yield List.of(lesson);
            }
            default -> throw new AssertionError(m.getName());
        }));
    }
}
