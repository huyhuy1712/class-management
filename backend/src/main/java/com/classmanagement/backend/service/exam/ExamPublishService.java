package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.dto.exam.*;
import com.classmanagement.backend.entity.Exam;
import com.classmanagement.backend.entity.ExamAssignment;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.exception.*;
import com.classmanagement.backend.repository.exam.*;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import static com.classmanagement.backend.service.exam.ExamStructureValidator.fail;

@Service
@RequiredArgsConstructor
public class ExamPublishService {
    private final ExamRepository exams;
    private final ExamAssignmentRepository assignments;
    private final ExamAttemptRepository attempts;
    private final ExamDetailService detailService;
    private final ExamStructureValidator structureValidator;
    private final ExamTargetValidator targetValidator;
    private final Validator validator;
    private final ExamAttemptDataRepository attemptData;

    @Transactional
    public PublishExamResponse publish(Long examId, String username) {
        Exam exam = lockOwnedExam(examId, username);
        var rows = assignments.findAllByExam_Id(examId);
        if (exam.getStatus() == ExamStatus.PUBLISHED) return response(exam, rows);
        if (exam.getStatus() != ExamStatus.DRAFT || attempts.existsByAssignment_Exam_Id(examId)) {
            throw new ConflictException("Chỉ đề DRAFT chưa có lượt thi được xuất bản");
        }
        if (rows.isEmpty()) fail("assignments", "Đề phải có ít nhất một lần giao");
        if (rows.stream().anyMatch(a -> a.getStatus() != ExamAssignmentStatus.DRAFT)) {
            throw new ConflictException("Các lần giao phải ở trạng thái DRAFT trước khi xuất bản");
        }
        var detail = detailService.get(examId, username);
        var basic = detail.basicInfo();
        validateBean(new CreateCompleteExamRequest.BasicInfo(basic.title(), basic.subjectId(), basic.gradeLevel(),
                basic.description(), basic.purpose(), basic.timeLimit(), basic.maxAttempts()), "basicInfo.");
        if (exam.getSubject() == null) fail("basicInfo.subjectId", "Đề phải có môn học");
        var summary = structureValidator.validateContent(detail.sections().stream().map(ExamPublishService::section).toList());
        if (exam.getMaxScore() == null || summary.totalScore().compareTo(exam.getMaxScore()) != 0) {
            fail("maxScore", "Tổng điểm không khớp nội dung đã lưu, hãy lưu lại nội dung đề");
        }
        for (var section : detail.sections()) {
            BigDecimal points = section.questions().stream().map(ExamDetailResponse.Question::points)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (section.points() == null || section.points().compareTo(points) != 0) {
                fail("sections", "Điểm section không khớp tổng điểm câu hỏi");
            }
        }
        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        for (var a : detail.assignments()) {
            var input = new CreateCompleteExamRequest.Assignment(a.assignmentType(), a.classIds(), a.studentIds(),
                    a.scoreVisibility(), a.answerVisibility(), a.threshold(), a.hideCorrectAnswerOnWrong(), a.openTime(), a.closeTime());
            validateBean(input, "assignments[" + a.id() + "].");
            structureValidator.validateAssignment(input);
            if (a.threshold() != null && a.threshold().compareTo(summary.totalScore()) > 0) {
                fail("assignments", "Ngưỡng xem đáp án vượt tổng điểm đề");
            }
            if (a.closeTime() != null && !a.closeTime().isAfter(now)) {
                fail("assignments", "Thời gian đóng phải ở tương lai khi xuất bản");
            }
            if ((a.timeLimit() != null && a.timeLimit() <= 0) || (a.maxAttempts() != null && a.maxAttempts() < 0)) {
                fail("assignments", "Thời gian/số lượt override không hợp lệ");
            }
        }
        targetValidator.validateForPublication(exam.getTeacher().getId(), detail.assignments());
        // Mutate only after the entire persisted exam and all targets pass validation.
        exam.setStatus(ExamStatus.PUBLISHED); exam.setUpdatedAt(now);
        for (var a : rows) {
            a.setStatus(a.getOpenTime() != null && a.getOpenTime().isAfter(now)
                    ? ExamAssignmentStatus.SCHEDULED : ExamAssignmentStatus.OPEN);
            a.setUpdatedAt(now);
        }
        exams.flush();
        attemptData.snapshot(examId);
        return response(exam, rows);
    }

    @Transactional
    public PublishExamResponse unpublish(Long examId, String username) {
        Exam exam = lockOwnedExam(examId, username);
        if (exam.getStatus() != ExamStatus.PUBLISHED && exam.getStatus() != ExamStatus.DRAFT) {
            throw new ConflictException("Chỉ đề PUBLISHED hoặc DRAFT được đưa về nháp");
        }
        if (attempts.existsByAssignment_Exam_Id(examId)) {
            throw new ConflictException("Đề đã có lượt thi, không thể đưa về nháp");
        }
        var rows = assignments.findAllByExam_Id(examId);
        if (exam.getStatus() == ExamStatus.DRAFT && rows.stream().allMatch(a -> a.getStatus() == ExamAssignmentStatus.DRAFT)) {
            return response(exam, rows);
        }
        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        exam.setStatus(ExamStatus.DRAFT); exam.setUpdatedAt(now);
        for (var a : rows) {
            a.setStatus(ExamAssignmentStatus.DRAFT);
            a.setUpdatedAt(now);
        }
        exams.flush();
        attemptData.clearCohort(examId);
        return response(exam, rows);
    }

    private Exam lockOwnedExam(Long examId, String username) {
        if (examId == null || examId <= 0) throw new IllegalArgumentException("examId phải lớn hơn 0");
        Exam exam = exams.findLockedByIdAndTeacher_Username(examId, username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi của bạn"));
        if (exam.getTeacher().getRole() != UserRole.TEACHER || exam.getTeacher().getStatus() != UserStatus.ACTIVE) {
            throw new IllegalStateException("Chỉ giáo viên đang hoạt động được đổi trạng thái đề");
        }
        return exam;
    }

    private void validateBean(Object value, String prefix) {
        Map<String, String> errors = new LinkedHashMap<>();
        validator.validate(value).forEach(v -> errors.put(prefix + v.getPropertyPath(), v.getMessage()));
        if (!errors.isEmpty()) throw new ExamValidationException(errors);
    }

    private static PublishExamResponse response(Exam exam, List<ExamAssignment> rows) {
        return new PublishExamResponse(exam.getId(), exam.getCode(), exam.getStatus(), exam.getRevision(), exam.getUpdatedAt(),
                rows.stream().sorted(Comparator.comparing(ExamAssignment::getId))
                        .map(a -> new PublishExamResponse.AssignmentStatus(a.getId(), a.getStatus())).toList());
    }

    private static UUID media(ExamDetailResponse.Media value) { return value == null ? null : value.mediaId(); }

    private static CreateCompleteExamRequest.Section section(ExamDetailResponse.Section s) {
        return new CreateCompleteExamRequest.Section(s.title(), s.paragraph(), media(s.imageMedia()), media(s.audioMedia()),
                s.questions().stream().map(q -> new CreateCompleteExamRequest.Question(q.content(), q.explanation(), media(q.imageMedia()),
                        media(q.audioMedia()), q.points(), q.answers().stream().map(a -> new CreateCompleteExamRequest.Answer(
                                a.answerType(), a.content(), media(a.imageMedia()), media(a.audioMedia()), a.points(),
                                a.scoringType(), a.correctAnswerText(), a.caseSensitive(), a.options().stream()
                                        .map(o -> new CreateCompleteExamRequest.Option(o.content(), media(o.imageMedia()),
                                                media(o.audioMedia()), o.isCorrect(), o.points())).toList(),
                                a.scoringRules().stream().map(r -> new CreateCompleteExamRequest.ScoringRule(
                                        r.correctCount(), r.score())).toList())).toList())).toList());
    }
}
