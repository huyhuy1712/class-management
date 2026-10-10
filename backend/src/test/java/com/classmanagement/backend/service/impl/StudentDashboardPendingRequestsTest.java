package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.repository.*;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import com.classmanagement.backend.repository.request.RequestRepository;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Proxy;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class StudentDashboardPendingRequestsTest {
    private long pendingCount;
    private int countQueries;
    private UserRole role = UserRole.STUDENT;

    @Test void returnsZeroWhenNoPendingJoinRequests() {
        assertEquals(0, service().getMyStudentDashboard("student").getPendingJoinClassCount());
        assertEquals(1, countQueries);
    }
    @Test void countsOnlyCurrentStudentPendingJoinRequests() {
        pendingCount = 100;
        var response = service().getMyStudentDashboard("student");
        assertEquals(100, response.getPendingJoinClassCount());
        assertEquals(1, countQueries);
        assertEquals("Student", response.getFullName());
        assertEquals(0, response.getAttendanceCount());
        assertEquals(0, response.getAttendanceRate());
    }
    @Test void teacherCannotQueryStudentCounts() {
        role = UserRole.TEACHER;
        assertThrows(IllegalStateException.class, () -> service().getMyStudentDashboard("student"));
        assertEquals(0, countQueries);
    }
    private UserServiceImpl service() {
        return new UserServiceImpl(repo(UserRepository.class), repo(ClassStudentRepository.class),
                repo(AttendanceRepository.class), null, null, repo(RequestRepository.class));
    }
    private <T> T repo(Class<T> type) {
        return type.cast(Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, (p, m, a) -> {
            return switch (m.getName()) {
                case "findByUsername" -> Optional.of(User.builder().id(21L).role(role).fullName("Student").build());
                case "findAllByStudent_Id" -> List.of();
                case "countByStudent_IdAndStatusIn" -> 0L;
                case "countBySender_IdAndTypeAndStatus" -> {
                    assertArrayEquals(new Object[]{21L, RequestType.JOIN_CLASS, RequestStatus.PENDING}, a);
                    countQueries++;
                    yield pendingCount;
                }
                default -> throw new AssertionError(m.getName());
            };
        }));
    }
}
