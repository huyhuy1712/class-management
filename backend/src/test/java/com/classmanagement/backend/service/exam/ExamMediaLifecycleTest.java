package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.exception.*;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.exam.ExamMediaRepository;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class ExamMediaLifecycleTest {
    @Test void contentCanKeepExistingAttachmentWithoutDraftToken() {
        var exam = Exam.builder().id(7L).build();
        media.setMediaType(ExamMediaType.IMAGE); media.setStatus(ExamMediaStatus.ATTACHED); media.setExam(exam);
        var result = lifecycle.claimForContent(Map.of(media.getId(), ExamMediaType.IMAGE), 1L, null, exam);
        assertSame(media, result.get(media.getId()));
    }

    @Test void contentCannotReuseAttachmentFromAnotherExam() {
        media.setMediaType(ExamMediaType.IMAGE); media.setStatus(ExamMediaStatus.ATTACHED);
        media.setExam(Exam.builder().id(8L).build());
        assertThrows(ExamMediaException.class, () -> lifecycle.claimForContent(
                Map.of(media.getId(), ExamMediaType.IMAGE), 1L, null, Exam.builder().id(7L).build()));
        assertEquals(8L, media.getExam().getId());
    }

    @Test void contentClaimsNewTemporaryMediaWithCorrectDraftToken() {
        media.setMediaType(ExamMediaType.AUDIO);
        var exam = Exam.builder().id(7L).build();
        lifecycle.claimForContent(Map.of(media.getId(), ExamMediaType.AUDIO), 1L, media.getDraftToken(), exam);
        assertEquals(ExamMediaStatus.ATTACHED, media.getStatus()); assertSame(exam, media.getExam());
    }

    @Test void contentCannotClaimTemporaryMediaWithoutDraftToken() {
        media.setMediaType(ExamMediaType.IMAGE);
        assertThrows(ExamMediaException.class, () -> lifecycle.claimForContent(
                Map.of(media.getId(), ExamMediaType.IMAGE), 1L, null, Exam.builder().id(7L).build()));
        assertEquals(ExamMediaStatus.TEMP, media.getStatus());
    }
    private boolean registryDeleted;
    private final User teacher = User.builder().id(1L).role(UserRole.TEACHER).status(UserStatus.ACTIVE).build();
    private final ExamMedia media = ExamMedia.builder().id(UUID.randomUUID()).teacher(teacher)
            .draftToken(UUID.randomUUID()).status(ExamMediaStatus.TEMP)
            .expiresAt(LocalDateTime.now().plusHours(1)).nextCleanupAt(LocalDateTime.now().plusHours(1)).build();
    private final ExamMediaRepository repository = proxy(ExamMediaRepository.class, (name, args) -> switch (name) {
        case "findLockedById" -> Optional.of(media);
        case "findAllLockedByIds" -> List.of(media);
        case "save" -> args[0];
        case "delete" -> { registryDeleted = true; yield null; }
        default -> null;
    });
    private final UserRepository users = proxy(UserRepository.class, (name, args) -> Optional.of(teacher));
    private final ExamMediaLifecycle lifecycle = new ExamMediaLifecycle(repository, users, 24);

    @Test void refusesStudentUploads() {
        teacher.setRole(UserRole.STUDENT);
        var error = assertThrows(ExamMediaException.class, () -> lifecycle.reserve("student", UUID.randomUUID(),
                ExamMediaType.IMAGE, new ExamMediaValidator.ValidatedFile("png", "image/png"), 10));
        assertEquals(403, error.getStatus().value());
    }

    @Test void refusesDeletionByAnotherTeacher() {
        media.setTeacher(User.builder().id(2L).build());
        assertThrows(ExamMediaException.class, () -> lifecycle.deleteTemporary("teacher", media.getId()));
        assertEquals(ExamMediaStatus.TEMP, media.getStatus());
    }

    @Test void refusesDeletingAttachedMedia() {
        media.setStatus(ExamMediaStatus.ATTACHED);
        assertThrows(ConflictException.class, () -> lifecycle.deleteTemporary("teacher", media.getId()));
    }

    @Test void temporaryDeleteQueuesPersistentCleanup() {
        lifecycle.deleteTemporary("teacher", media.getId());
        assertEquals(ExamMediaStatus.DELETE_PENDING, media.getStatus());
        var firstDeadline = media.getNextCleanupAt();
        lifecycle.deleteTemporary("teacher", media.getId());
        assertEquals(firstDeadline, media.getNextCleanupAt());
    }

    @Test void claimsValidMediaWithoutMovingItsPath() {
        media.setObjectPath("stable/file.png");
        Exam exam = Exam.builder().id(3L).teacher(teacher).build();
        var result = lifecycle.claimTemporary(List.of(media.getId(), media.getId()), 1L, media.getDraftToken(), exam);
        assertEquals(1, result.size());
        assertEquals(ExamMediaStatus.ATTACHED, media.getStatus());
        assertEquals("stable/file.png", media.getObjectPath());
        assertSame(exam, media.getExam());
    }

    @Test void refusesExpiredMediaClaim() {
        media.setExpiresAt(LocalDateTime.now().minusSeconds(1));
        assertThrows(ConflictException.class, () -> lifecycle.claimTemporary(
                List.of(media.getId()), 1L, media.getDraftToken(), new Exam()));
    }

    @Test void refusesMediaFromAnotherDraft() {
        assertThrows(ExamMediaException.class, () -> lifecycle.claimTemporary(
                List.of(media.getId()), 1L, UUID.randomUUID(), new Exam()));
    }

    @Test void cleanupCannotLeaseLiveAttachedMedia() {
        media.setStatus(ExamMediaStatus.ATTACHED);
        media.setExam(new Exam());
        media.setNextCleanupAt(LocalDateTime.now().minusSeconds(1));
        assertNull(lifecycle.leaseCleanup(media.getId()));
        assertEquals(ExamMediaStatus.ATTACHED, media.getStatus());
    }

    @Test void retrySurvivesFailedCleanup() {
        media.setNextCleanupAt(LocalDateTime.now().minusSeconds(1));
        media.setObjectPath("stable/file.png");
        assertEquals("stable/file.png", lifecycle.leaseCleanup(media.getId()));
        lifecycle.cleanupFailed(media.getId());
        assertEquals(ExamMediaStatus.DELETE_PENDING, media.getStatus());
        assertEquals(1, media.getCleanupAttempts());
        assertTrue(media.getNextCleanupAt().isAfter(LocalDateTime.now()));
    }

    @Test void successfulCleanupRemovesRegistry() {
        media.setStatus(ExamMediaStatus.DELETE_PENDING);
        lifecycle.cleanupSucceeded(media.getId());
        assertTrue(registryDeleted);
    }

    @Test void cleanupDoesNotRemoveAttachedRegistry() {
        media.setStatus(ExamMediaStatus.ATTACHED);
        lifecycle.cleanupSucceeded(media.getId());
        assertFalse(registryDeleted);
    }

    private interface Call { Object invoke(String name, Object[] args); }
    private static <T> T proxy(Class<T> type, Call call) {
        return type.cast(Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type},
                (ignored, method, args) -> call.invoke(method.getName(), args)));
    }
}
