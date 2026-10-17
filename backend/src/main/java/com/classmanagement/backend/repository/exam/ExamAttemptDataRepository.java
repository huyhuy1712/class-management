package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.dto.exam.ClassExamResponse;
import com.classmanagement.backend.dto.exam.ClassGradebookResponse;
import com.classmanagement.backend.dto.exam.ExamAttemptPayload;
import com.classmanagement.backend.dto.exam.ExamAttemptResponse;
import com.classmanagement.backend.dto.exam.ExamDetailResponse;
import com.classmanagement.backend.dto.exam.StudentClassExamResultsResponse;
import com.classmanagement.backend.entity.enums.ExamAttemptStatus;
import com.classmanagement.backend.repository.exam.assignment.ExamAssignmentAttemptStore;
import com.classmanagement.backend.repository.exam.attempt.ExamAttemptAnswerStore;
import com.classmanagement.backend.repository.exam.attempt.ExamAttemptLifecycleStore;
import com.classmanagement.backend.repository.exam.gradebook.ClassGradebookQueries;
import com.classmanagement.backend.service.exam.attempt.ExamScoringCalculator;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

/** Stable entry point; JDBC operations are grouped by responsibility in child packages. */
@Repository
public class ExamAttemptDataRepository {

    private final ExamAttemptAnswerStore answers;
    private final ExamAttemptLifecycleStore attempts;
    private final ExamAssignmentAttemptStore assignments;
    private final ClassGradebookQueries gradebook;

    @Value("${app.exam.expiry-batch-size:20}")
    private int expiryBatchSize = 20;

    public ExamAttemptDataRepository(NamedParameterJdbcTemplate jdbc) {
        this.answers = new ExamAttemptAnswerStore(jdbc);
        this.attempts = new ExamAttemptLifecycleStore(jdbc);
        this.assignments = new ExamAssignmentAttemptStore(jdbc);
        this.gradebook = new ClassGradebookQueries(jdbc);
    }

    public record Ref(Long id, Long examId, Long studentId, Long assignmentId) {
    }

    public boolean ownsExamClass(String username, Long classId) {
        return assignments.ownsExamClass(username, classId);
    }

    public List<ClassExamResponse> classExams(Long classId) {
        return assignments.classExams(classId);
    }

    public Optional<Ref> ref(Long id) {
        return attempts.ref(id);
    }

    public Optional<Long> assignmentExamId(Long id) {
        return attempts.assignmentExamId(id);
    }

    public List<Ref> expired(LocalDateTime now) {
        return attempts.expired(now, expiryBatchSize);
    }

    public void reset(Long id) {
        attempts.reset(id);
    }

    public Map<Long, Map<Long, ExamAttemptPayload.Value>> readAnswers(Collection<Long> ids) {
        return answers.readAnswers(ids);
    }

    public Map<Long, BigDecimal> manualScores(Long id) {
        return answers.manualScores(id);
    }

    public void write(Long id, Long examId, List<ExamDetailResponse.Section> structure,
            Map<Long, ExamAttemptPayload.Value> values, ExamScoringCalculator.Scores scores, LocalDateTime now,
            Long teacherId) {
        answers.write(id, examId, structure, values, scores, now, teacherId);
    }

    public int events(Long id, List<ExamAttemptPayload.Event> events, LocalDateTime now) {
        return attempts.events(id, events, now);
    }

    public List<ExamAttemptResponse.Event> readEvents(Long id) {
        return attempts.readEvents(id);
    }

    public void clearCohort(Long examId) {
        assignments.clearCohort(examId);
    }

    public void snapshot(Long examId) {
        assignments.snapshot(examId);
    }

    public void snapshotAssignment(Long assignmentId) {
        assignments.snapshotAssignment(assignmentId);
    }

    public void completed(Long assignmentId, Long studentId, LocalDateTime now) {
        assignments.completed(assignmentId, studentId, now);
    }

    public void resetCompletion(Long assignmentId, Long studentId) {
        assignments.resetCompletion(assignmentId, studentId);
    }

    public boolean released(Long assignmentId, LocalDateTime now) {
        return assignments.released(assignmentId, now);
    }

    public boolean classAllowed(Long assignmentId, Long classId) {
        return assignments.classAllowed(assignmentId, classId);
    }

    public ExamAttemptResponse.Page list(Long assignmentId, int page, int size, ExamAttemptStatus status, String q,
            String sort, Long classId) {
        return assignments.list(assignmentId, page, size, status, q, sort, classId);
    }

    public boolean studentClassAllowed(Long classId, Long studentId, Long teacherId) {
        return gradebook.studentClassAllowed(classId, studentId, teacherId);
    }

    public Optional<ClassGradebookResponse.ClassInfo> gradebookClass(Long classId, Long teacherId) {
        return gradebook.gradebookClass(classId, teacherId);
    }

    public ClassGradebookResponse gradebook(ClassGradebookResponse.ClassInfo classroom, Long teacherId, int page,
            int size, String q, Long subjectId) {
        return gradebook.gradebook(classroom, teacherId, page, size, q, subjectId);
    }

    public StudentClassExamResultsResponse studentClassResults(Long classId, Long studentId, Long teacherId, int page,
            int size) {
        return gradebook.studentClassResults(classId, studentId, teacherId, page, size);
    }

}
