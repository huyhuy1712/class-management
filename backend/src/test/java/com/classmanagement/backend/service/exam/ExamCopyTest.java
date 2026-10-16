package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.service.exam.media.ExamMediaLifecycle;
import com.classmanagement.backend.service.exam.validation.ExamStructureValidator;

import com.classmanagement.backend.dto.exam.*;
import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.repository.exam.*;
import com.classmanagement.backend.service.StorageService;
import jakarta.persistence.EntityManager;
import jakarta.validation.Validation;
import org.hibernate.validator.messageinterpolation.ParameterMessageInterpolator;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.util.*;
import java.util.function.BiFunction;
import static org.junit.jupiter.api.Assertions.*;

class ExamCopyTest {
    final User teacher = User.builder().id(1L).role(UserRole.TEACHER).status(UserStatus.ACTIVE).build();
    final Exam original = Exam.builder().id(7L).teacher(teacher).title("Đề đã thi").status(ExamStatus.PUBLISHED)
            .timeLimit(60).maxAttempts(2).gradeLevel("12").maxScore(BigDecimal.ONE).build();
    final UUID imageId = UUID.randomUUID();
    Exam copied;
    ExamAssignment assigned;
    boolean failCopy;
    final List<Object> saved = new ArrayList<>();
    final List<String> copiedFiles = new ArrayList<>(), deletedFiles = new ArrayList<>();
    ExamMedia reservation;

    @Test void copiesTreeAndMediaButNeverAttemptsOrOldSchedule() {
        TransactionSynchronizationManager.initSynchronization();
        try {
            var service = service();
            UUID requestId = UUID.randomUUID();
            var result = service.copy(7L, "teacher", new CopyExamRequest(requestId));
            assertEquals(99L, result.id());
            assertEquals(ExamStatus.DRAFT, copied.getStatus());
            assertEquals("Đề đã thi (Bản sao)", copied.getTitle());
            assertNotEquals(original.getCode(), copied.getCode());
            assertEquals(7L, copied.getCopiedFromExamId());
            assertEquals(requestId, copied.getCopyRequestId());
            assertEquals(ExamStatus.PUBLISHED, original.getStatus());
            assertEquals(ExamAssignmentStatus.DRAFT, assigned.getStatus());
            assertNull(assigned.getOpenTime()); assertNull(assigned.getCloseTime());
            assertNull(assigned.getResultsReleasedAt());
            var target = saved.stream().filter(ExamAssignmentStudent.class::isInstance).map(ExamAssignmentStudent.class::cast).findFirst().orElseThrow();
            assertEquals(100L, target.getId().getAssignmentId());
            assertEquals(12L, target.getStudent().getId());
            assertEquals(21L, target.getClassroom().getId());
            assertEquals(1, copiedFiles.size());
            var question = saved.stream().filter(Question.class::isInstance).map(Question.class::cast).findFirst().orElseThrow();
            assertEquals("Giải thích", question.getExplanation());
            assertNotEquals("old.png", question.getExplanationImageUrl());
            var media = saved.stream().filter(ExamMedia.class::isInstance).map(ExamMedia.class::cast).findFirst().orElseThrow();
            assertEquals(copied, media.getExam()); assertNotEquals(imageId, media.getId());
            assertEquals(media.getObjectPath(), question.getExplanationImageUrl());
            int count = saved.size();
            service.copy(7L, "teacher", new CopyExamRequest(requestId));
            assertEquals(count, saved.size()); assertEquals(1, copiedFiles.size());
        } finally { TransactionSynchronizationManager.clearSynchronization(); }
    }

    @Test void rejectsInactiveTeacherAndForeignExam() {
        teacher.setStatus(UserStatus.INACTIVE);
        assertThrows(IllegalStateException.class, () -> service().copy(7L, "teacher", new CopyExamRequest(UUID.randomUUID())));
        assertThrows(com.classmanagement.backend.exception.ResourceNotFoundException.class,
                () -> service().copy(7L, "other", new CopyExamRequest(UUID.randomUUID())));
        assertTrue(saved.isEmpty());
    }

    @Test void storageFailureRegistersRollbackCleanupForOnlyNewPath() {
        TransactionSynchronizationManager.initSynchronization(); failCopy = true;
        try {
            assertThrows(IllegalStateException.class, () -> service().copy(7L, "teacher", new CopyExamRequest(UUID.randomUUID())));
            TransactionSynchronizationManager.getSynchronizations().forEach(s -> s.afterCompletion(1));
            assertEquals(copiedFiles, deletedFiles);
            assertFalse(deletedFiles.contains("old.png"));
        } finally { TransactionSynchronizationManager.clearSynchronization(); }
    }

    ExamCreationService service() {
        var detail = new ExamDetailService(null,null,null,null,null,null,null,null) {
            @Override public ExamDetailResponse get(Long id, String username) {
                var basic = new ExamConfigurationResponse.BasicInfo("Đề đã thi", 1L,"Toán","12",null,null,60,2);
                var answer = new ExamDetailResponse.Answer(50L,1,AnswerType.SHORT_ANSWER,null,BigDecimal.ONE,
                        ScoringType.PER_ANSWER,"1",null,false,null,null,List.of(),List.of());
                var question = new ExamDetailResponse.Question(40L,1,"Câu hỏi","Giải thích",BigDecimal.ONE,null,null,
                        List.of(answer),new ExamDetailResponse.Media(imageId,"url"),null);
                var section = new ExamDetailResponse.Section(30L,1,"Phần 1",null,BigDecimal.ONE,null,null,List.of(question));
                var assignment = new ExamConfigurationResponse.Assignment(8L,ExamAssignmentStatus.OPEN,ExamAssignmentType.STUDENT,
                        List.of(),List.of(12L),40,3,ScoreVisibility.AFTER_EXAM,AnswerVisibility.AFTER_SUBMIT,null,false,
                        java.time.LocalDateTime.now().minusDays(2),java.time.LocalDateTime.now().minusDays(1),null,
                        List.of(new ExamConfigurationResponse.StudentClassContext(12L,21L)));
                return new ExamDetailResponse(id,"CODE",id == 7L ? ExamStatus.PUBLISHED : ExamStatus.DRAFT,
                        BigDecimal.ONE,null,basic,List.of(assignment),List.of(section),0L);
            }
        };
        var exams = proxy(ExamRepository.class, (method,args) -> switch(method) {
            case "findLockedByIdAndTeacher_Username" -> "teacher".equals(args[1]) ? Optional.of(original) : Optional.empty();
            case "findByTeacher_UsernameAndCopiedFromExamIdAndCopyRequestId" -> Optional.ofNullable(copied);
            case "existsByTeacher_IdAndCode" -> false;
            case "save" -> { copied=(Exam)args[0]; copied.setId(99L); saved.add(copied); yield copied; }
            case "flush" -> null;
            default -> throw new AssertionError(method);
        });
        var media = proxy(ExamMediaRepository.class,(method,args) -> {
            if (method.equals("findAllLockedByIds")) return List.of(ExamMedia.builder().id(imageId).exam(original).teacher(teacher)
                    .objectPath("old.png").contentType("image/png").mediaType(ExamMediaType.IMAGE).status(ExamMediaStatus.ATTACHED).build());
            if (method.equals("save")) { saved.add(args[0]); return args[0]; }
            if (method.equals("findLockedById")) return Optional.of(reservation);
            throw new AssertionError(method);
        });
        var storage = proxy(StorageService.class,(method,args) -> {
            if (method.equals("copy")) { copiedFiles.add((String)args[1]); if (failCopy) throw new IllegalStateException("Storage failed"); }
            else if (method.equals("delete")) deletedFiles.add((String)args[0]);
            else throw new AssertionError(method);
            return null;
        });
        var validator = Validation.byDefaultProvider().configure().messageInterpolator(new ParameterMessageInterpolator()).buildValidatorFactory().getValidator();
        var lifecycle = new ExamMediaLifecycle(media,null,24) {
            @Override public ExamMedia reserveCopy(ExamMedia source, UUID token) {
                reservation = super.reserveCopy(source, token);
                return reservation;
            }
        };
        return new ExamCreationService(new ExamStructureValidator(validator),lifecycle,null,null,null,null,exams,
                writes(ExamAssignmentRepository.class),writes(ExamSectionRepository.class),writes(QuestionRepository.class),
                writes(AnswerRepository.class),writes(AnswerOptionRepository.class),writes(QuestionScoringRuleRepository.class),
                proxy(EntityManager.class,(method,args) -> {
                    if (method.equals("persist")) { saved.add(args[0]); return null; }
                    if (method.equals("getReference")) return args[0] == User.class ? User.builder().id((Long)args[1]).build() : Classroom.builder().id((Long)args[1]).build();
                    throw new AssertionError(method);
                }),detail,media,storage);
    }

    <T> T writes(Class<T> type) {
        return proxy(type,(method,args) -> {
            if (method.equals("save")) { assigned=(ExamAssignment)args[0]; assigned.setId(100L); saved.add(assigned); return assigned; }
            if (method.equals("saveAll")) { ((Iterable<?>)args[0]).forEach(saved::add); return args[0]; }
            throw new AssertionError(method);
        });
    }
    static <T> T proxy(Class<T> type, BiFunction<String,Object[],Object> invoke) {
        return type.cast(Proxy.newProxyInstance(type.getClassLoader(),new Class<?>[]{type},(p,m,a) -> invoke.apply(m.getName(),a)));
    }
}
