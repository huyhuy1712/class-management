package com.classmanagement.backend.service.exam;

import static com.classmanagement.backend.service.exam.validation.ExamStructureValidator.fail;

import com.classmanagement.backend.dto.exam.*;
import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.exception.*;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.exam.*;
import com.classmanagement.backend.service.exam.attempt.ExamScoringCalculator;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ExamAttemptService {
    private final UserRepository users;
    private final ExamRepository exams;
    private final ExamAssignmentRepository assignments;
    private final ExamAttemptRepository attempts;
    private final StudentExamReadRepository eligibility;
    private final ExamDetailService papers;
    private final ExamAttemptDataRepository data;
    private final com.classmanagement.backend.service.StorageService storage;

    private static LocalDateTime now() {
        return LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
    }

    private static OffsetDateTime offset(LocalDateTime time) {
        return time == null ? null : time.atOffset(ZoneOffset.ofHours(7));
    }

    @Transactional
    public void resetByTeacher(Long id, String username, ExamAttemptPayload.Reset request) {
        var attempt = lock(id, user(username, UserRole.TEACHER), true);
        generation(attempt, request.attemptNumber());
        revision(attempt, request.revision());
        if (!finished(attempt)) throw new ConflictException("Chỉ bài đã nộp mới được xóa kết quả");
        var assignment = attempt.getAssignment();
        var exam = assignment.getExam();
        var now = now();
        boolean retake = request.mode() == ExamAttemptPayload.ResetMode.RETAKE;
        if (retake
                && (exam.getStatus() != ExamStatus.PUBLISHED
                        || !Set.of(ExamAssignmentStatus.OPEN, ExamAssignmentStatus.SCHEDULED)
                                .contains(assignment.getStatus())
                        || assignment.getCloseTime() != null
                                && !assignment.getCloseTime().isAfter(now))) {
            throw new ConflictException("Đợt thi đã đóng. Hãy mở đợt giao mới để học sinh thi lại");
        }
        if (retake) {
            int limit =
                    assignment.getMaxAttempts() != null
                            ? assignment.getMaxAttempts()
                            : exam.getMaxAttempts();
            if (attempt.getAttemptLimitOverride() != null)
                limit = attempt.getAttemptLimitOverride();
            attempt.setAttemptLimitOverride(
                    limit == 0 ? 0 : Math.max(limit, attempt.getAttemptCount() + 1));
            data.resetCompletion(assignment.getId(), attempt.getStudent().getId());
        }
        data.reset(id);
        attempt.setTeacherBlocked(!retake);
        attempt.setStartRequestId(null);
        attempt.setDeadlineAt(null);
        attempt.setStartedAt(null);
        attempt.setSubmittedAt(null);
        attempt.setDurationSeconds(null);
        attempt.setAutoScore(BigDecimal.ZERO);
        attempt.setManualScore(BigDecimal.ZERO);
        attempt.setTotalScore(BigDecimal.ZERO);
        attempt.setTeacherComment(null);
        attempt.setTabSwitchCount(0);
        attempt.setStatus(ExamAttemptStatus.NOT_STARTED);
        attempt.setUpdatedAt(now);
        attempts.flush();
    }

    @Transactional
    public ExamAttemptResponse.TeacherReview teacherReview(Long id, String username) {
        var attempt = lock(id, user(username, UserRole.TEACHER), true);
        if (!finished(attempt)) throw new ConflictException("Bài chưa nộp hoặc đã bị xóa kết quả");
        var exam = attempt.getAssignment().getExam();
        var student = attempt.getStudent();
        return new ExamAttemptResponse.TeacherReview(
                attempt.getAssignment().getId(),
                new ExamAttemptResponse.ExamInfo(
                        exam.getId(),
                        exam.getTitle(),
                        exam.getCode(),
                        exam.getMaxScore(),
                        exam.getTimeLimit(),
                        exam.getMaxAttempts()),
                new ExamAttemptResponse.StudentInfo(
                        student.getId(),
                        student.getFullName(),
                        student.getStudentCode(),
                        student.getAvatar() == null ? null : storage.getUrl(student.getAvatar())),
                result(attempt, true));
    }

    @Transactional
    public ExamAttemptResponse start(
            Long assignmentId, String username, ExamAttemptPayload.Start request) {
        positive(assignmentId);
        User student = user(username, UserRole.STUDENT);
        Long examId = data.assignmentExamId(assignmentId).orElseThrow(() -> missing());
        exams.findSharedLockedById(examId).orElseThrow(() -> missing());
        var assignment = assignments.findById(assignmentId).orElseThrow(() -> missing());
        var attempt =
                attempts.findLockedByAssignment_IdAndStudent_Id(assignmentId, student.getId())
                        .orElse(null);
        if (attempt != null && request.requestId().equals(attempt.getStartRequestId()))
            return view(attempt, false);
        int count = attempt == null ? 0 : attempt.getAttemptCount();
        if (request.expectedAttemptCount() != count)
            throw new ConflictException("Số lượt đã thay đổi, hãy tải lại trước khi bắt đầu");
        if (attempt != null && attempt.getStatus() == ExamAttemptStatus.IN_PROGRESS)
            return view(attempt, false);
        var access =
                eligibility
                        .findAccessible(assignmentId, student.getId())
                        .orElseThrow(() -> missing());
        var available = StudentExamReadService.response(access, List.of(), now());
        if (!available.canStart())
            throw new ConflictException("Không thể bắt đầu bài thi: " + available.blockedReason());
        if (attempt == null) {
            attempts.insertIfAbsent(assignmentId, student.getId());
            attempt =
                    attempts.findLockedByAssignment_IdAndStudent_Id(assignmentId, student.getId())
                            .orElseThrow(() -> missing());
            if (request.requestId().equals(attempt.getStartRequestId()))
                return view(attempt, false);
            if (attempt.getAttemptCount() != count)
                throw new ConflictException("Lượt thi đã được bắt đầu ở request khác");
        }
        data.reset(attempt.getId());
        LocalDateTime now = now(), deadline = now.plusMinutes(available.timeLimit());
        if (assignment.getCloseTime() != null && assignment.getCloseTime().isBefore(deadline))
            deadline = assignment.getCloseTime();
        attempt.setAttemptCount(count + 1);
        attempt.setStartRequestId(request.requestId());
        attempt.setDeadlineAt(deadline);
        attempt.setStartedAt(now);
        attempt.setSubmittedAt(null);
        attempt.setDurationSeconds(null);
        attempt.setAutoScore(BigDecimal.ZERO);
        attempt.setManualScore(BigDecimal.ZERO);
        attempt.setTotalScore(BigDecimal.ZERO);
        attempt.setTeacherComment(null);
        attempt.setTabSwitchCount(0);
        attempt.setStatus(ExamAttemptStatus.IN_PROGRESS);
        attempt.setUpdatedAt(now);
        attempts.flush();
        return view(attempt, false);
    }

    @Transactional
    public ExamAttemptResponse get(Long id, String username) {
        return view(lock(id, user(username, UserRole.STUDENT), false), false);
    }

    @Transactional
    public ExamAttemptResponse save(Long id, String username, ExamAttemptPayload.Save request) {
        LocalDateTime received = now();
        var attempt = lock(id, user(username, UserRole.STUDENT), false);
        generation(attempt, request.attemptNumber());
        if (attempt.getStatus() != ExamAttemptStatus.IN_PROGRESS)
            throw new ConflictException("Lượt thi không còn đang làm");
        var structure = papers.getStructure(attempt.getAssignment().getExam().getId());
        if (expiredAt(attempt, received)) {
            finish(attempt, structure, saved(attempt), null);
            return view(attempt, false, structure);
        }
        revision(attempt, request.revision());
        var values = ExamScoringCalculator.validate(structure, request.answers());
        validateEvents(request.events());
        LocalDateTime now = now();
        data.write(
                attempt.getId(),
                attempt.getAssignment().getExam().getId(),
                structure,
                values,
                null,
                now,
                null);
        attempt.setTabSwitchCount(data.events(attempt.getId(), request.events(), now));
        attempt.setUpdatedAt(now);
        attempts.flush();
        // Autosave response is small: do not return the complete paper again.
        return response(attempt, List.of(), List.of(), null);
    }

    @Transactional
    public ExamAttemptResponse.Result submit(
            Long id, String username, ExamAttemptPayload.Save request) {
        LocalDateTime received = now();
        var attempt = lock(id, user(username, UserRole.STUDENT), false);
        generation(attempt, request.attemptNumber());
        if (finished(attempt)) return result(attempt, false);
        if (attempt.getStatus() != ExamAttemptStatus.IN_PROGRESS)
            throw new ConflictException("Lượt thi chưa bắt đầu");
        var structure = papers.getStructure(attempt.getAssignment().getExam().getId());
        Map<Long, ExamAttemptPayload.Value> values;
        boolean timedOut = expiredAt(attempt, received);
        if (timedOut) values = saved(attempt);
        else {
            revision(attempt, request.revision());
            values = ExamScoringCalculator.validate(structure, request.answers());
            validateEvents(request.events());
            attempt.setTabSwitchCount(data.events(attempt.getId(), request.events(), now()));
        }
        finish(attempt, structure, values, timedOut ? null : received);
        return result(attempt, false, structure, values);
    }

    @Transactional
    public ExamAttemptResponse.Result result(Long id, String username) {
        User user = user(username, null);
        var attempt = lock(id, user, true);
        boolean teacher = user.getRole() == UserRole.TEACHER;
        if (attempt.getStatus() == ExamAttemptStatus.IN_PROGRESS && expired(attempt)) {
            var structure = papers.getStructure(attempt.getAssignment().getExam().getId());
            finish(attempt, structure, saved(attempt), null);
        }
        if (!finished(attempt)) throw new ConflictException("Bài chưa nộp");
        return result(attempt, teacher);
    }

    @Transactional
    public ExamAttemptResponse.Result grade(
            Long id, String username, ExamAttemptPayload.Grades request) {
        User teacher = user(username, UserRole.TEACHER);
        var attempt = lock(id, teacher, true);
        generation(attempt, request.attemptNumber());
        revision(attempt, request.revision());
        if (!finished(attempt)) throw new ConflictException("Chỉ bài đã nộp được chấm");
        if (request.grades() == null || request.grades().isEmpty()) {
            if (request.teacherComment() == null)
                fail("teacherComment", "Cần điểm tự luận hoặc nhận xét để cập nhật");
            attempt.setTeacherComment(
                    request.teacherComment().isBlank() ? null : request.teacherComment().trim());
            attempt.setUpdatedAt(now());
            attempts.flush();
            return result(attempt, true);
        }
        var structure = papers.getStructure(attempt.getAssignment().getExam().getId());
        var groups = ExamScoringCalculator.groups(structure);
        var grades = data.manualScores(id);
        Set<Long> seen = new HashSet<>();
        for (var item : request.grades()) {
            var group = groups.get(item.answerId());
            if (group == null
                    || group.answerType() != AnswerType.ESSAY
                    || !seen.add(item.answerId())
                    || item.score().compareTo(group.points()) > 0) {
                fail(
                        "grades",
                        "Chỉ nhận nhóm tự luận thuộc đề, không trùng và không vượt điểm tối đa");
            }
            grades.put(item.answerId(), item.score());
        }
        var values = saved(attempt);
        for (var item : request.grades()) {
            var value = values.get(item.answerId());
            if (value == null || value.text() == null || value.text().isBlank())
                fail("grades", "Câu tự luận bỏ trống có điểm 0, không nhận điểm thủ công");
        }
        var scores = ExamScoringCalculator.score(structure, values, grades);
        data.write(
                id,
                attempt.getAssignment().getExam().getId(),
                structure,
                values,
                scores,
                now(),
                teacher.getId());
        totals(attempt, scores);
        if (request.teacherComment() != null)
            attempt.setTeacherComment(
                    request.teacherComment().isBlank() ? null : request.teacherComment().trim());
        attempt.setUpdatedAt(now());
        attempts.flush();
        return result(attempt, true, structure, values);
    }

    @Transactional(readOnly = true)
    public ExamAttemptResponse.Page list(
            Long assignmentId,
            String username,
            int page,
            int size,
            ExamAttemptStatus status,
            String q,
            String sort,
            Long classId) {
        positive(assignmentId);
        if (page < 0 || size < 1 || size > 100)
            throw new IllegalArgumentException("page >= 0, size 1..100");
        if (classId != null) positive(classId);
        q = q == null ? "" : q.trim();
        sort = sort == null ? "newest" : sort;
        if (q.length() > 200
                || !Set.of("newest", "oldest", "name", "score_desc", "score_asc").contains(sort))
            throw new IllegalArgumentException(
                    "q tối đa 200 ký tự; sort: newest, oldest, name, score_desc, score_asc");
        User teacher = user(username, UserRole.TEACHER);
        var a =
                assignments
                        .findByIdAndExam_Teacher_Username(assignmentId, username)
                        .orElseThrow(() -> missing());
        if (!a.getExam().getTeacher().getId().equals(teacher.getId())) throw missing();
        if (classId != null && !data.classAllowed(assignmentId, classId)) throw missing();
        var result = data.list(assignmentId, page, size, status, q, sort, classId);
        var items =
                result.items().stream()
                        .map(
                                s ->
                                        new ExamAttemptResponse.Summary(
                                                s.attemptId(),
                                                s.studentId(),
                                                s.fullName(),
                                                s.attemptNumber(),
                                                s.status(),
                                                s.tabSwitchCount(),
                                                s.totalScore(),
                                                s.avatarUrl() == null || s.avatarUrl().isBlank()
                                                        ? null
                                                        : storage.getUrl(s.avatarUrl()),
                                                s.studentCode(),
                                                s.email(),
                                                s.startedAt(),
                                                s.submittedAt(),
                                                s.durationSeconds(),
                                                s.teacherComment(),
                                                s.isFinal(),
                                                s.revision()))
                        .toList();
        return new ExamAttemptResponse.Page(
                items, result.page(), result.size(), result.totalElements(), result.stats());
    }

    @Transactional
    public void expireBatch() {
        var refs = data.expired(now());
        if (refs.isEmpty()) return;
        exams.findSharedLockedBatch(
                refs.stream()
                        .map(ExamAttemptDataRepository.Ref::examId)
                        .distinct()
                        .sorted()
                        .toList());
        assignments.findAllById(
                refs.stream().map(ExamAttemptDataRepository.Ref::assignmentId).distinct().toList());
        // Acquire every attempt before updating completion flags to keep lock ordering consistent.
        var locked =
                attempts
                        .findLockedBatch(
                                refs.stream()
                                        .map(ExamAttemptDataRepository.Ref::id)
                                        .sorted()
                                        .toList())
                        .stream()
                        .filter(a -> a.getStatus() == ExamAttemptStatus.IN_PROGRESS && expired(a))
                        .toList();
        var values = data.readAnswers(locked.stream().map(ExamAttempt::getId).toList());
        Map<Long, List<ExamDetailResponse.Section>> structures = new HashMap<>();
        for (var a : locked) {
            Long examId = a.getAssignment().getExam().getId();
            var structure = structures.computeIfAbsent(examId, papers::getStructure);
            finish(a, structure, values.getOrDefault(a.getId(), Map.of()), null);
        }
    }

    @Transactional(readOnly = true)
    public StudentClassExamResultsResponse studentClassResults(
            Long classId, Long studentId, String username, int page, int size) {
        positive(classId);
        positive(studentId);
        if (page < 0 || size < 1 || size > 100)
            throw new IllegalArgumentException("page >= 0, size 1..100");
        var teacher = user(username, UserRole.TEACHER);
        if (!data.studentClassAllowed(classId, studentId, teacher.getId())) throw missing();
        return data.studentClassResults(classId, studentId, teacher.getId(), page, size);
    }

    @Transactional(
            readOnly = true,
            isolation = org.springframework.transaction.annotation.Isolation.REPEATABLE_READ)
    public ClassGradebookResponse gradebook(
            Long classId, String username, int page, int size, String query, Long subjectId) {
        positive(classId);
        if (subjectId != null) positive(subjectId);
        String q = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        if (page < 0 || size < 1 || size > 100 || q.length() > 200)
            throw new IllegalArgumentException("page >= 0, size 1..100, q <= 200 ký tự");
        var teacher = user(username, UserRole.TEACHER);
        var classroom = data.gradebookClass(classId, teacher.getId()).orElseThrow(() -> missing());
        var result = data.gradebook(classroom, teacher.getId(), page, size, q, subjectId);
        var students =
                result.items().stream()
                        .map(
                                s ->
                                        new ClassGradebookResponse.Student(
                                                s.studentId(),
                                                s.studentCode(),
                                                s.fullName(),
                                                s.email(),
                                                s.phone(),
                                                s.avatarUrl() == null || s.avatarUrl().isBlank()
                                                        ? null
                                                        : storage.getUrl(s.avatarUrl()),
                                                s.joinedAt(),
                                                s.averageScoreOnTen(),
                                                s.gradedCount(),
                                                s.cells()))
                        .toList();
        return new ClassGradebookResponse(
                classroom, result.columns(), students, page, size, result.totalElements());
    }

    private ExamAttempt lock(Long id, User user, boolean allowTeacher) {
        positive(id);
        var ref = data.ref(id).orElseThrow(() -> missing());
        if (user.getRole() == UserRole.STUDENT && !ref.studentId().equals(user.getId()))
            throw missing();
        if (!allowTeacher && user.getRole() != UserRole.STUDENT)
            throw new IllegalStateException("Chỉ học sinh được thực hiện thao tác này");
        var exam = exams.findSharedLockedById(ref.examId()).orElseThrow(() -> missing());
        if (user.getRole() == UserRole.TEACHER && !exam.getTeacher().getId().equals(user.getId()))
            throw missing();
        return attempts.findLockedById(id).orElseThrow(() -> missing());
    }

    private User user(String username, UserRole role) {
        var user = users.findByUsername(username).orElseThrow(() -> missing());
        if (user.getStatus() != UserStatus.ACTIVE
                || (role != null && user.getRole() != role)
                || (role == null
                        && user.getRole() != UserRole.STUDENT
                        && user.getRole() != UserRole.TEACHER)) {
            throw new IllegalStateException("Tài khoản không có quyền thực hiện thao tác");
        }
        return user;
    }

    private static void positive(Long id) {
        if (id == null || id <= 0) throw new IllegalArgumentException("ID phải lớn hơn 0");
    }

    private static ResourceNotFoundException missing() {
        return new ResourceNotFoundException("Không tìm thấy bài thi được phép truy cập");
    }

    private static void generation(ExamAttempt a, Integer number) {
        if (!Objects.equals(a.getAttemptCount(), number))
            throw new ConflictException("Request thuộc lượt thi cũ");
    }

    private static void revision(ExamAttempt a, Long revision) {
        if (!Objects.equals(a.getRevision(), revision))
            throw new ConflictException("Bài đã thay đổi, hãy tải lại trước khi ghi");
    }

    private static boolean expired(ExamAttempt a) {
        return expiredAt(a, now());
    }

    private static boolean expiredAt(ExamAttempt a, LocalDateTime time) {
        return a.getDeadlineAt() == null || !time.isBefore(a.getDeadlineAt());
    }

    private static boolean finished(ExamAttempt a) {
        return a.getStatus() == ExamAttemptStatus.SUBMITTED
                || a.getStatus() == ExamAttemptStatus.GRADED;
    }

    private Map<Long, ExamAttemptPayload.Value> saved(ExamAttempt a) {
        return data.readAnswers(List.of(a.getId())).getOrDefault(a.getId(), Map.of());
    }

    private static void validateEvents(List<ExamAttemptPayload.Event> events) {
        Set<UUID> seen = new HashSet<>();
        if (events != null)
            for (var e : events)
                if (!seen.add(e.eventId())) fail("events", "eventId bị trùng trong payload");
    }

    private void finish(
            ExamAttempt a,
            List<ExamDetailResponse.Section> structure,
            Map<Long, ExamAttemptPayload.Value> values,
            LocalDateTime received) {
        var validated = ExamScoringCalculator.validate(structure, new ArrayList<>(values.values()));
        var scores = ExamScoringCalculator.score(structure, validated, Map.of());
        LocalDateTime now = now(),
                finish =
                        received == null
                                ? (a.getDeadlineAt() == null ? now : a.getDeadlineAt())
                                : received;
        data.write(
                a.getId(),
                a.getAssignment().getExam().getId(),
                structure,
                validated,
                scores,
                now,
                null);
        totals(a, scores);
        a.setSubmittedAt(finish);
        a.setDurationSeconds(
                (int)
                        Math.min(
                                Integer.MAX_VALUE,
                                Math.max(
                                        0,
                                        Duration.between(
                                                        a.getStartedAt() == null
                                                                ? finish
                                                                : a.getStartedAt(),
                                                        finish)
                                                .getSeconds())));
        a.setUpdatedAt(now);
        attempts.flush();
        data.completed(a.getAssignment().getId(), a.getStudent().getId(), now);
        if (a.getAssignment().getScoreVisibility() == ScoreVisibility.AFTER_EXAM
                || a.getAssignment().getAnswerVisibility() == AnswerVisibility.AFTER_EXAM)
            data.released(a.getAssignment().getId(), now);
    }

    private static void totals(ExamAttempt a, ExamScoringCalculator.Scores scores) {
        a.setAutoScore(scores.autoScore());
        a.setManualScore(scores.manualScore());
        a.setTotalScore(scores.autoScore().add(scores.manualScore()));
        a.setStatus(scores.pending() ? ExamAttemptStatus.SUBMITTED : ExamAttemptStatus.GRADED);
    }

    private ExamAttemptResponse view(ExamAttempt a, boolean teacher) {
        return view(a, teacher, papers.getStructure(a.getAssignment().getExam().getId()));
    }

    private ExamAttemptResponse view(
            ExamAttempt a, boolean teacher, List<ExamDetailResponse.Section> structure) {
        var values = saved(a);
        if (a.getStatus() == ExamAttemptStatus.IN_PROGRESS && expired(a))
            finish(a, structure, values, null);
        if (finished(a))
            return response(a, List.of(), List.of(), result(a, teacher, structure, values));
        if (a.getStatus() != ExamAttemptStatus.IN_PROGRESS)
            throw new ConflictException("Lượt thi chưa bắt đầu");
        return response(a, paper(structure), new ArrayList<>(values.values()), null);
    }

    private static ExamAttemptResponse response(
            ExamAttempt a,
            List<ExamAttemptResponse.Section> sections,
            List<ExamAttemptPayload.Value> values,
            ExamAttemptResponse.Result result) {
        var assignment = a.getAssignment();
        var exam = assignment.getExam();
        var info =
                new ExamAttemptResponse.ExamInfo(
                        exam.getId(),
                        exam.getTitle(),
                        exam.getCode(),
                        exam.getMaxScore(),
                        assignment.getTimeLimit() == null
                                ? exam.getTimeLimit()
                                : assignment.getTimeLimit(),
                        assignment.getMaxAttempts() == null
                                ? exam.getMaxAttempts()
                                : assignment.getMaxAttempts());
        return new ExamAttemptResponse(
                a.getId(),
                assignment.getId(),
                a.getAttemptCount(),
                a.getRevision(),
                a.getStatus(),
                offset(now()),
                offset(a.getDeadlineAt()),
                a.getTabSwitchCount(),
                info,
                sections,
                values,
                result);
    }

    private ExamAttemptResponse.Result result(ExamAttempt a, boolean teacher) {
        return result(
                a, teacher, papers.getStructure(a.getAssignment().getExam().getId()), saved(a));
    }

    private ExamAttemptResponse.Result result(
            ExamAttempt a,
            boolean teacher,
            List<ExamDetailResponse.Section> structure,
            Map<Long, ExamAttemptPayload.Value> values) {
        var assignment = a.getAssignment();
        boolean released =
                (assignment.getScoreVisibility() == ScoreVisibility.AFTER_EXAM
                                || assignment.getAnswerVisibility() == AnswerVisibility.AFTER_EXAM)
                        && data.released(assignment.getId(), now());
        boolean score =
                teacher
                        || switch (assignment.getScoreVisibility()) {
                            case NEVER -> false;
                            case AFTER_SUBMIT -> true;
                            case AFTER_EXAM -> released;
                        };
        boolean answers =
                teacher
                        || switch (assignment.getAnswerVisibility()) {
                            case NEVER -> false;
                            case AFTER_SUBMIT -> true;
                            case AFTER_EXAM -> released;
                            case AFTER_SCORE ->
                                    a.getStatus() == ExamAttemptStatus.GRADED
                                            && assignment.getAnswerVisibilityScore() != null
                                            && a.getTotalScore()
                                                            .compareTo(
                                                                    assignment
                                                                            .getAnswerVisibilityScore())
                                                    >= 0;
                        };
        List<ExamAttemptResponse.Review> review = new ArrayList<>();
        List<ExamAttemptResponse.SectionScore> sectionScores = List.of();
        Set<Long> explanationQuestions = new HashSet<>();
        if (score || answers) {
            var scores =
                    ExamScoringCalculator.score(structure, values, data.manualScores(a.getId()));
            if (score) sectionScores = scores.sections();
            if (answers) {
                Map<Long, Boolean> correctness = new HashMap<>();
                scores.groups().forEach(g -> correctness.put(g.answerId(), g.correct()));
                for (var section : structure)
                    for (var question : section.questions()) {
                        if (teacher
                                || !Boolean.TRUE.equals(assignment.getHideCorrectAnswerOnWrong())
                                || question.answers().stream()
                                        .allMatch(
                                                g ->
                                                        Boolean.TRUE.equals(
                                                                correctness.get(g.id())))) {
                            explanationQuestions.add(question.id());
                        }
                    }
                var groups = ExamScoringCalculator.groups(structure);
                for (var graded : scores.groups()) {
                    var group = groups.get(graded.answerId());
                    boolean hide =
                            !teacher
                                    && Boolean.TRUE.equals(assignment.getHideCorrectAnswerOnWrong())
                                    && Boolean.FALSE.equals(graded.correct());
                    review.add(
                            new ExamAttemptResponse.Review(
                                    group.id(),
                                    hide ? null : group.correctAnswerText(),
                                    hide
                                            ? List.of()
                                            : group.options().stream()
                                                    .filter(o -> Boolean.TRUE.equals(o.isCorrect()))
                                                    .map(ExamDetailResponse.Option::id)
                                                    .toList(),
                                    hide || group.answerType() != AnswerType.TRUE_FALSE
                                            ? List.of()
                                            : group.options().stream()
                                                    .map(
                                                            o ->
                                                                    new ExamAttemptPayload
                                                                            .BooleanAnswer(
                                                                            o.id(), o.isCorrect()))
                                                    .toList(),
                                    score ? graded.score() : null,
                                    graded.correct()));
                }
            }
        }
        return new ExamAttemptResponse.Result(
                a.getId(),
                a.getAttemptCount(),
                a.getRevision(),
                offset(a.getSubmittedAt()),
                a.getDurationSeconds(),
                a.getStatus(),
                score,
                answers,
                a.getStatus() == ExamAttemptStatus.GRADED,
                score ? a.getAutoScore() : null,
                score ? a.getManualScore() : null,
                score ? a.getTotalScore() : null,
                a.getTeacherComment(),
                sectionScores,
                answers ? paper(structure, explanationQuestions) : List.of(),
                answers ? new ArrayList<>(values.values()) : List.of(),
                review,
                a.getTabSwitchCount(),
                teacher ? data.readEvents(a.getId()) : List.of());
    }

    private static List<ExamAttemptResponse.Section> paper(
            List<ExamDetailResponse.Section> sections) {
        return paper(sections, Set.of());
    }

    private static List<ExamAttemptResponse.Section> paper(
            List<ExamDetailResponse.Section> sections, Set<Long> explanationQuestions) {
        return sections.stream()
                .map(
                        s ->
                                new ExamAttemptResponse.Section(
                                        s.id(),
                                        s.title(),
                                        s.paragraph(),
                                        s.imageMedia(),
                                        s.audioMedia(),
                                        s.questions().stream()
                                                .map(
                                                        q ->
                                                                new ExamAttemptResponse.Question(
                                                                        q.id(),
                                                                        q.content(),
                                                                        explanationQuestions
                                                                                        .contains(
                                                                                                q
                                                                                                        .id())
                                                                                ? q.explanation()
                                                                                : null,
                                                                        q.points(),
                                                                        q.imageMedia(),
                                                                        q.audioMedia(),
                                                                        q.answers().stream()
                                                                                .map(
                                                                                        a ->
                                                                                                new ExamAttemptResponse
                                                                                                        .Group(
                                                                                                        a
                                                                                                                .id(),
                                                                                                        a
                                                                                                                .answerType(),
                                                                                                        a
                                                                                                                                .answerType()
                                                                                                                        == AnswerType
                                                                                                                                .SHORT_ANSWER
                                                                                                                ? null
                                                                                                                : a
                                                                                                                        .content(),
                                                                                                        a
                                                                                                                .points(),
                                                                                                        a
                                                                                                                .imageMedia(),
                                                                                                        a
                                                                                                                .audioMedia(),
                                                                                                        a
                                                                                                                .options()
                                                                                                                .stream()
                                                                                                                .map(
                                                                                                                        o ->
                                                                                                                                new ExamAttemptResponse
                                                                                                                                        .Option(
                                                                                                                                        o
                                                                                                                                                .id(),
                                                                                                                                        o
                                                                                                                                                .content(),
                                                                                                                                        o
                                                                                                                                                .imageMedia(),
                                                                                                                                        o
                                                                                                                                                .audioMedia()))
                                                                                                                .toList()))
                                                                                .toList(),
                                                                        explanationQuestions
                                                                                        .contains(
                                                                                                q
                                                                                                        .id())
                                                                                ? q
                                                                                        .explanationImageMedia()
                                                                                : null,
                                                                        explanationQuestions
                                                                                        .contains(
                                                                                                q
                                                                                                        .id())
                                                                                ? q
                                                                                        .explanationAudioMedia()
                                                                                : null))
                                                .toList()))
                .toList();
    }
}
