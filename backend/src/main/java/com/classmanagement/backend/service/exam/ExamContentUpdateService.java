package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.dto.exam.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.exception.*;
import com.classmanagement.backend.repository.exam.*;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import static com.classmanagement.backend.service.exam.ExamStructureValidator.fail;

@Service
@RequiredArgsConstructor
public class ExamContentUpdateService {
    private final ExamRepository examRepository;
    private final ExamAttemptRepository attemptRepository;
    private final ExamAssignmentRepository assignmentRepository;
    private final ExamSectionRepository sectionRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final AnswerOptionRepository optionRepository;
    private final QuestionScoringRuleRepository ruleRepository;
    private final ExamMediaRepository mediaRepository;
    private final ExamMediaLifecycle mediaLifecycle;
    private final ExamStructureValidator structureValidator;
    private final ExamContentWriter writer;
    private final Validator validator;

    @Transactional
    public UpdateExamContentResponse update(Long examId, String username, UpdateExamContentRequest request) {
        if (examId == null || examId <= 0) throw new IllegalArgumentException("examId phải là số nguyên dương.");
        if (request == null) fail("request", "Thiếu dữ liệu nội dung đề");
        Map<String, String> errors = new LinkedHashMap<>();
        validator.validate(request).forEach(v -> errors.put(v.getPropertyPath().toString(), v.getMessage()));
        if (!errors.isEmpty()) throw new ExamValidationException(errors);
        var summary = structureValidator.validateContent(request.sections().stream().map(s -> s.toCreate()).toList());
        var exam = examRepository.findLockedByIdAndTeacher_Username(examId, username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi."));
        if (exam.getStatus() != ExamStatus.DRAFT || attemptRepository.existsByAssignment_Exam_Id(examId)) {
            throw new ConflictException("Chỉ đề DRAFT chưa có lượt làm được sửa nội dung.");
        }
        if (!request.revision().equals(exam.getRevision())) {
            throw new ConflictException("Đề thi đã thay đổi, vui lòng tải lại trước khi lưu.");
        }
        var teacher = exam.getTeacher();
        if (teacher.getRole() != UserRole.TEACHER || teacher.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalStateException("Chỉ giáo viên đang hoạt động được sửa nội dung.");
        }
        for (var assignment : assignmentRepository.findAllByExam_Id(examId)) {
            if (assignment.getAnswerVisibilityScore() != null
                    && assignment.getAnswerVisibilityScore().compareTo(summary.totalScore()) > 0) {
                fail("sections", "Tổng điểm mới thấp hơn ngưỡng xem đáp án của một lần giao. Hãy sửa cấu hình trước.");
            }
        }
        var plan = new ExamContentPlan(examId, request, sectionRepository, questionRepository,
                answerRepository, optionRepository, ruleRepository);
        var previousMedia = mediaRepository.findAllByExam_IdAndStatus(examId, ExamMediaStatus.ATTACHED);
        var media = mediaLifecycle.claimForContent(summary.mediaTypes(), teacher.getId(), request.draftToken(), exam);
        var mappings = writer.write(exam, plan, media);
        var unusedMedia = previousMedia.stream().map(m -> m.getId()).filter(id -> !media.containsKey(id))
                .collect(Collectors.toSet());
        if (!unusedMedia.isEmpty()) mediaRepository.queueUnusedByExamId(examId, unusedMedia, LocalDateTime.now());
        exam.setMaxScore(summary.totalScore());
        exam.setUpdatedAt(LocalDateTime.now());
        examRepository.flush();
        return new UpdateExamContentResponse(exam.getId(), exam.getCode(), exam.getStatus(), exam.getMaxScore(),
                exam.getRevision(), exam.getUpdatedAt(), mappings);
    }
}
