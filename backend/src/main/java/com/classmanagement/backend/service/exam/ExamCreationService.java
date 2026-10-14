package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.dto.exam.*;
import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.compositeID.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.exception.*;
import com.classmanagement.backend.repository.*;
import com.classmanagement.backend.repository.classroom.*;
import com.classmanagement.backend.repository.exam.*;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.*;
import static com.classmanagement.backend.service.exam.ExamStructureValidator.*;
import com.classmanagement.backend.service.exam.ExamTargetValidator.Targets;

@Service
@RequiredArgsConstructor
public class ExamCreationService {
    private static final SecureRandom CODE_RANDOM = new SecureRandom();
    private static final int MAX_CODE_ATTEMPTS = 10;
    private final ExamStructureValidator structureValidator;
    private final ExamMediaLifecycle mediaLifecycle;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final ClassroomRepository classroomRepository;
    private final ClassStudentRepository classStudentRepository;
    private final ExamRepository examRepository;
    private final ExamAssignmentRepository assignmentRepository;
    private final ExamSectionRepository sectionRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final AnswerOptionRepository optionRepository;
    private final QuestionScoringRuleRepository ruleRepository;
    private final EntityManager entityManager;
    private final ExamDetailService detailService;
    private final ExamMediaRepository mediaRepository;
    private final com.classmanagement.backend.service.StorageService storage;

    @Transactional
    public ExamDetailResponse copy(Long sourceId, String username, CopyExamRequest request) {
        if (sourceId == null || sourceId <= 0) throw new IllegalArgumentException("examId phải lớn hơn 0");
        if (request == null || request.requestId() == null) throw new IllegalArgumentException("Thiếu mã yêu cầu sao chép");
        var source = examRepository.findLockedByIdAndTeacher_Username(sourceId, username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi của bạn"));
        var teacher = source.getTeacher();
        if (teacher.getRole() != UserRole.TEACHER || teacher.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalStateException("Chỉ giáo viên đang hoạt động được sao chép đề thi");
        }
        var previous = examRepository.findByTeacher_UsernameAndCopiedFromExamIdAndCopyRequestId(username, sourceId, request.requestId());
        if (previous.isPresent()) return detailService.get(previous.get().getId(), username);
        var detail = detailService.get(sourceId, username);
        var sections = detail.sections().stream().map(ExamPublishService::section).toList();
        var summary = structureValidator.validateContent(sections);
        String suffix = " (Bản sao)";
        String title = source.getTitle();
        title = title.substring(0, Math.min(title.length(), 255 - suffix.length())) + suffix;
        var exam = examRepository.save(Exam.builder().teacher(teacher).subject(source.getSubject())
                .title(title).code(generateCode(teacher.getId())).gradeLevel(source.getGradeLevel())
                .description(source.getDescription()).purpose(source.getPurpose()).timeLimit(source.getTimeLimit())
                .maxAttempts(source.getMaxAttempts()).maxScore(summary.totalScore()).status(ExamStatus.DRAFT)
                .copiedFromExamId(sourceId).copyRequestId(request.requestId()).build());
        var files = copyMedia(sourceId, exam, summary.mediaTypes());
        var booleans = detail.sections().stream().flatMap(s -> s.questions().stream())
                .flatMap(q -> q.answers().stream()).map(ExamDetailResponse.Answer::correctBoolean).toList();
        persistTree(exam, sections, files, booleans);
        // Only the latest target configuration is copied, never attempts or completion cohorts.
        var assignment = detail.assignments().stream().max(Comparator.comparing(ExamConfigurationResponse.Assignment::id)).orElse(null);
        var row = assignmentRepository.save(ExamAssignment.builder().exam(exam).status(ExamAssignmentStatus.DRAFT)
                .assignmentType(assignment == null ? ExamAssignmentType.ALL : assignment.assignmentType())
                .scoreVisibility(assignment == null ? ScoreVisibility.NEVER : assignment.scoreVisibility())
                .answerVisibility(assignment == null ? AnswerVisibility.NEVER : assignment.answerVisibility())
                .answerVisibilityScore(assignment == null ? null : assignment.threshold())
                .hideCorrectAnswerOnWrong(assignment != null && Boolean.TRUE.equals(assignment.hideCorrectAnswerOnWrong()))
                .timeLimit(assignment == null ? null : assignment.timeLimit())
                .maxAttempts(assignment == null ? null : assignment.maxAttempts()).build());
        if (assignment != null) {
            for (var id : assignment.classIds()) entityManager.persist(ExamAssignmentClass.builder()
                    .id(new ExamAssignmentClassId(row.getId(), id)).assignment(row)
                    .classroom(entityManager.getReference(Classroom.class, id)).build());
            var contexts = assignment.studentClasses().stream().filter(c -> c.classId() != null)
                    .collect(java.util.stream.Collectors.toMap(ExamConfigurationResponse.StudentClassContext::studentId,
                            ExamConfigurationResponse.StudentClassContext::classId));
            for (var id : assignment.studentIds()) entityManager.persist(ExamAssignmentStudent.builder()
                    .id(new ExamAssignmentStudentId(row.getId(), id)).assignment(row)
                    .student(entityManager.getReference(User.class, id))
                    .classroom(contexts.containsKey(id) ? entityManager.getReference(Classroom.class, contexts.get(id)) : null).build());
        }
        examRepository.flush();
        return detailService.get(exam.getId(), username);
    }

    private Map<UUID, ExamMedia> copyMedia(Long sourceId, Exam exam, Map<UUID, ExamMediaType> types) {
        if (types.isEmpty()) return Map.of();
        var sourceFiles = mediaRepository.findAllLockedByIds(types.keySet());
        if (sourceFiles.size() != types.size()) throw new ConflictException("Media đề gốc không còn đầy đủ");
        List<String> copiedPaths = new ArrayList<>();
        org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                new org.springframework.transaction.support.TransactionSynchronization() {
                    @Override public void afterCompletion(int status) {
                        if (status == STATUS_COMMITTED) return;
                        for (String path : copiedPaths) {
                            try { storage.delete(path); }
                            catch (RuntimeException error) { org.slf4j.LoggerFactory.getLogger(ExamCreationService.class)
                                    .warn("Không thể dọn tệp sao chép {}", path, error); }
                        }
                    }
                });
        Map<UUID, ExamMedia> result = new HashMap<>();
        UUID token = UUID.randomUUID();
        for (var file : sourceFiles) {
            if (file.getStatus() != ExamMediaStatus.ATTACHED || file.getExam() == null
                    || !sourceId.equals(file.getExam().getId()) || !file.getTeacher().getId().equals(exam.getTeacher().getId())
                    || file.getMediaType() != types.get(file.getId())) throw new ConflictException("Media không thuộc đề gốc");
            var reserved = mediaLifecycle.reserveCopy(file, token);
            var copy = mediaRepository.findLockedById(reserved.getId()).orElseThrow();
            String path = copy.getObjectPath();
            copiedPaths.add(path);
            storage.copy(file.getObjectPath(), path);
            copy.setExam(exam);
            copy.setStatus(ExamMediaStatus.ATTACHED);
            result.put(file.getId(), copy);
        }
        return result;
    }

    @Transactional
    public CreateExamResponse create(String username, CreateCompleteExamRequest request) {
        User teacher = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy giáo viên"));
        if (teacher.getRole() != UserRole.TEACHER || teacher.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalStateException("Chỉ giáo viên đang hoạt động được tạo đề thi");
        }
        Summary summary = structureValidator.validate(request);
        var basic = request.basicInfo();
        Subject subject = subjectRepository.findById(basic.subjectId()).orElse(null);
        if (subject == null) fail("basicInfo.subjectId", "Không tìm thấy môn học");
        Targets targets = new ExamTargetValidator(classroomRepository, classStudentRepository, userRepository).validate(teacher.getId(), request.assignment());
        String code = generateCode(teacher.getId());
        try {
            Exam exam = examRepository.save(Exam.builder().teacher(teacher).subject(subject)
                    .title(basic.title().trim()).code(code).gradeLevel(basic.gradeLevel().trim())
                    .description(trim(basic.description())).purpose(trim(basic.purpose()))
                    .timeLimit(basic.timeLimit()).maxAttempts(basic.maxAttempts())
                    .maxScore(summary.totalScore()).status(ExamStatus.DRAFT).build());
            Map<UUID, ExamMedia> media = mediaLifecycle.claimTemporary(summary.mediaTypes().keySet(),
                    teacher.getId(), request.draftToken(), exam);
            summary.mediaTypes().forEach((id, type) -> {
                if (media.get(id).getMediaType() != type) fail("sections", "Loại media không đúng vị trí ảnh/audio");
            });
            ExamAssignment assignment = persistAssignment(exam, request.assignment(), targets);
            persistTree(exam, request.sections(), media);
            // One boundary flush surfaces child constraint failures before constructing a response.
            examRepository.flush();
            return new CreateExamResponse(exam.getId(), exam.getCode(), exam.getStatus(), exam.getMaxScore(),
                    assignment.getId(), exam.getUpdatedAt());
        } catch (DataIntegrityViolationException ex) {
            Throwable cause = ex;
            while (cause != null) {
                if (cause instanceof org.hibernate.exception.ConstraintViolationException violation
                        && "uq_exams_teacher_code".equals(violation.getConstraintName())) {
                    // A concurrent insert can win after the existence check.
                    // The transaction must roll back; never retry inside a failed transaction.
                    throw new ConflictException("Mã đề vừa bị trùng, vui lòng tạo lại đề để sinh mã mới");
                }
                cause = cause.getCause();
            }
            throw new ConflictException("Dữ liệu liên kết đã thay đổi, không thể lưu đề thi. Vui lòng kiểm tra và thử lại");
        }
    }

    private String generateCode(Long teacherId) {
        for (int attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
            StringBuilder code = new StringBuilder("EX-").append(teacherId).append('-');
            for (int index = 0; index < 6; index++) code.append((char) ('A' + CODE_RANDOM.nextInt(26)));
            String candidate = code.toString();
            if (!examRepository.existsByTeacher_IdAndCode(teacherId, candidate)) return candidate;
        }
        throw new ConflictException("Chưa thể sinh mã đề duy nhất, vui lòng thử lại");
    }

    private ExamAssignment persistAssignment(Exam exam, CreateCompleteExamRequest.Assignment source, Targets targets) {
        ExamAssignment assignment = assignmentRepository.save(ExamAssignment.builder().exam(exam)
                .assignmentType(source.assignmentType()).status(ExamAssignmentStatus.DRAFT)
                .scoreVisibility(source.scoreVisibility()).answerVisibility(source.answerVisibility())
                .answerVisibilityScore(source.answerVisibilityScore())
                .hideCorrectAnswerOnWrong(source.hideCorrectAnswerOnWrong())
                .openTime(source.openTime()).closeTime(source.closeTime()).build());
        // Assigned composite IDs make saveAll choose merge and SELECT each target.
        // These rows are new: persist directly to avoid those per-target reads.
        for (var classroom : targets.classes()) {
            entityManager.persist(ExamAssignmentClass.builder()
                    .id(new ExamAssignmentClassId(assignment.getId(), classroom.getId()))
                    .assignment(assignment).classroom(classroom).build());
        }
        for (var student : targets.students()) {
            entityManager.persist(ExamAssignmentStudent.builder()
                    .id(new ExamAssignmentStudentId(assignment.getId(), student.getId()))
                    .assignment(assignment).student(student).classroom(targets.classroom()).build());
        }
        return assignment;
    }

    private void persistTree(Exam exam, List<CreateCompleteExamRequest.Section> sections, Map<UUID, ExamMedia> media) {
        persistTree(exam, sections, media, null);
    }

    private void persistTree(Exam exam, List<CreateCompleteExamRequest.Section> sections, Map<UUID, ExamMedia> media, List<Boolean> booleans) {
        List<SectionNode> sectionNodes = new ArrayList<>();
        for (int index = 0; index < sections.size(); index++) {
            var source = sections.get(index);
            BigDecimal points = source.questions().stream().map(CreateCompleteExamRequest.Question::points)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            sectionNodes.add(new SectionNode(source, ExamSection.builder().exam(exam).title(source.title().trim())
                    .paragraph(trim(source.paragraph())).orderIndex(index + 1).points(points)
                    .imageUrl(path(media, source.imageMediaId())).audioUrl(path(media, source.audioMediaId())).build()));
        }
        sectionRepository.saveAll(sectionNodes.stream().map(SectionNode::entity).toList());
        List<QuestionNode> questionNodes = new ArrayList<>();
        for (var section : sectionNodes) {
            for (int index = 0; index < section.source().questions().size(); index++) {
                var source = section.source().questions().get(index);
                questionNodes.add(new QuestionNode(source, Question.builder().section(section.entity())
                        .content(source.content().trim()).explanation(trim(source.explanation())).points(source.points()).orderIndex(index + 1)
                        .explanationImageUrl(path(media, source.explanationImageMediaId())).explanationAudioUrl(path(media, source.explanationAudioMediaId()))
                        .imageUrl(path(media, source.imageMediaId())).audioUrl(path(media, source.audioMediaId())).build()));
            }
        }
        questionRepository.saveAll(questionNodes.stream().map(QuestionNode::entity).toList());
        List<AnswerNode> answerNodes = new ArrayList<>();
        for (var question : questionNodes) {
            for (int index = 0; index < question.source().answers().size(); index++) {
                var source = question.source().answers().get(index);
                answerNodes.add(new AnswerNode(source, Answer.builder().question(question.entity())
                        .answerType(source.answerType()).content(trim(source.content()))
                        .points(source.points()).scoringType(source.scoringType()).orderIndex(index + 1)
                        .correctAnswerText(trim(source.correctAnswerText())).caseSensitive(Boolean.TRUE.equals(source.caseSensitive()))
                        .imageUrl(path(media, source.imageMediaId())).audioUrl(path(media, source.audioMediaId())).build()));
            }
        }
        if (booleans != null) for (int i = 0; i < answerNodes.size(); i++) answerNodes.get(i).entity().setCorrectBoolean(booleans.get(i));
        answerRepository.saveAll(answerNodes.stream().map(AnswerNode::entity).toList());
        List<AnswerOption> options = new ArrayList<>();
        List<QuestionScoringRule> rules = new ArrayList<>();
        for (var answer : answerNodes) {
            for (int index = 0; index < list(answer.source().options()).size(); index++) {
                var source = answer.source().options().get(index);
                options.add(AnswerOption.builder().answer(answer.entity()).content(trim(source.content()))
                        .correct(source.isCorrect()).orderIndex(index + 1)
                        .points(source.points() == null ? BigDecimal.ZERO : source.points())
                        .imageUrl(path(media, source.imageMediaId())).audioUrl(path(media, source.audioMediaId())).build());
            }
            for (var source : list(answer.source().scoringRules())) {
                rules.add(QuestionScoringRule.builder().answer(answer.entity())
                        .correctCount(source.correctCount()).score(source.score()).build());
            }
        }
        optionRepository.saveAll(options);
        ruleRepository.saveAll(rules);
    }

    private static String path(Map<UUID, ExamMedia> media, UUID id) { return id == null ? null : media.get(id).getObjectPath(); }
    private static String trim(String value) { return value == null || value.isBlank() ? null : value.trim(); }

    private record SectionNode(CreateCompleteExamRequest.Section source, ExamSection entity) {}
    private record QuestionNode(CreateCompleteExamRequest.Question source, Question entity) {}
    private record AnswerNode(CreateCompleteExamRequest.Answer source, Answer entity) {}
}
