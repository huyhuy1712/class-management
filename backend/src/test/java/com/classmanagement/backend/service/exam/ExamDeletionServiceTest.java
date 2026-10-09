package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.entity.Exam;
import com.classmanagement.backend.exception.ConflictException;
import com.classmanagement.backend.repository.exam.*;
import com.classmanagement.backend.service.impl.ExamServiceImpl;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Proxy;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class ExamDeletionServiceTest {
    private final List<String> calls = new ArrayList<>();
    private boolean hasAttempts;
    private boolean missingExam;
    private boolean failQueue;

    @Test void queuesAllMediaBeforeDeletingExam() {
        service().deleteExam(7L, "teacher", false);
        assertEquals(List.of("exam.findLockedByIdAndTeacher_Username", "attempt.existsByAssignment_Exam_Id",
                "media.queueCleanupByExamId", "exam.delete", "exam.flush"), calls);
    }

    @Test void attemptConflictDoesNotQueueOrDelete() {
        hasAttempts = true;
        assertThrows(ConflictException.class, () -> service().deleteExam(7L, "teacher", false));
        assertFalse(calls.contains("media.queueCleanupByExamId"));
        assertFalse(calls.contains("exam.delete"));
    }

    @Test void forceDeleteQueuesMediaEvenWithAttempts() {
        hasAttempts = true;
        service().deleteExam(7L, "teacher", true);
        assertTrue(calls.contains("media.queueCleanupByExamId"));
        assertTrue(calls.contains("exam.delete"));
        assertFalse(calls.contains("attempt.existsByAssignment_Exam_Id"));
    }

    @Test void wrongOwnerDoesNotQueueOrDelete() {
        missingExam = true;
        assertThrows(IllegalArgumentException.class, () -> service().deleteExam(7L, "other", true));
        assertEquals(List.of("exam.findLockedByIdAndTeacher_Username"), calls);
    }

    @Test void queueFailureDoesNotDeleteExam() {
        failQueue = true;
        assertThrows(IllegalStateException.class, () -> service().deleteExam(7L, "teacher", true));
        assertFalse(calls.contains("exam.delete"));
    }

    private ExamServiceImpl service() {
        return new ExamServiceImpl(null, repository(ExamRepository.class, "exam"), null, null,
                repository(ExamAttemptRepository.class, "attempt"),
                repository(ExamMediaRepository.class, "media"));
    }

    private <T> T repository(Class<T> type, String name) {
        return type.cast(Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, (ignored, method, args) -> {
            calls.add(name + "." + method.getName());
            return switch (method.getName()) {
                case "findLockedByIdAndTeacher_Username" -> missingExam ? Optional.empty() : Optional.of(Exam.builder().id(7L).build());
                case "existsByAssignment_Exam_Id" -> hasAttempts;
                case "queueCleanupByExamId" -> {
                    if (failQueue) throw new IllegalStateException("Queue failed");
                    assertEquals(7L, args[0]);
                    yield 3;
                }
                default -> null;
            };
        }));
    }
}
