package com.classmanagement.backend.service;

import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.ExamAttemptStatus;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.exam.ExamAttemptRepository;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Proxy;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;

class StudentProfileStatsServiceTest {
    @Test void usesAuthenticatedStudentAndOnlyCompletedStatuses() {
        var student = User.builder().id(7L).username("student").role(UserRole.STUDENT).build();
        UserRepository users = (UserRepository) Proxy.newProxyInstance(getClass().getClassLoader(), new Class[]{UserRepository.class}, (p, method, args) -> {
            assertEquals("student", args[0]); return Optional.of(student);
        });
        ExamAttemptRepository attempts = (ExamAttemptRepository) Proxy.newProxyInstance(getClass().getClassLoader(), new Class[]{ExamAttemptRepository.class}, (p, method, args) -> {
            assertEquals(7L, args[0]);
            assertEquals(List.of(ExamAttemptStatus.SUBMITTED, ExamAttemptStatus.GRADED), args[1]);
            return 3L;
        });
        assertEquals(3L, new StudentProfileStatsService(users, attempts).getExamCount("student").completedExamCount());
        student.setRole(UserRole.TEACHER);
        assertThrows(IllegalStateException.class, () -> new StudentProfileStatsService(users, attempts).getExamCount("student"));
    }
}
