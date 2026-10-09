package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.dto.exam.*;
import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.compositeID.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.exception.*;
import com.classmanagement.backend.repository.SubjectRepository;
import com.classmanagement.backend.repository.exam.*;
import jakarta.persistence.EntityManager;
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
public class ExamConfigurationUpdateService {
    private final ExamRepository examRepository;
    private final ExamAssignmentRepository assignmentRepository;
    private final ExamAttemptRepository attemptRepository;
    private final ExamAssignmentClassRepository classRepository;
    private final ExamAssignmentStudentRepository studentRepository;
    private final SubjectRepository subjectRepository;
    private final ExamStructureValidator structureValidator;
    private final ExamTargetValidator targetValidator;
    private final ExamConfigurationService configurationService;
    private final Validator validator;
    private final EntityManager entityManager;

    @Transactional
    public ExamConfigurationResponse update(Long examId, String username, UpdateExamRequest request) {
        if (examId == null || examId <= 0) throw new IllegalArgumentException("examId phải là số nguyên dương.");
        if (request == null) fail("request", "Thiếu dữ liệu cấu hình");
        Map<String, String> errors = new LinkedHashMap<>();
        validator.validate(request).forEach(v -> errors.put(v.getPropertyPath().toString(), v.getMessage()));
        if (!errors.isEmpty()) throw new ExamValidationException(errors);
        var exam = examRepository.findLockedByIdAndTeacher_Username(examId, username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi."));
        if (exam.getStatus() != ExamStatus.DRAFT) throw new ConflictException("Chỉ đề thi DRAFT được sửa cấu hình.");
        var source = request.assignment();
        var assignment = assignmentRepository.findLockedByIdAndExam_Id(source.id(), examId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lần giao của đề thi."));
        if (assignment.getStatus() != ExamAssignmentStatus.DRAFT || attemptRepository.existsByAssignment_Id(source.id())) {
            throw new ConflictException("Lần giao đã hoạt động hoặc có lượt làm, không thể sửa cấu hình.");
        }
        var teacher = exam.getTeacher();
        if (teacher.getRole() != UserRole.TEACHER || teacher.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalStateException("Chỉ giáo viên đang hoạt động được sửa cấu hình.");
        }
        var input = source.toCreateAssignment();
        try { structureValidator.validateAssignment(input); }
        catch (ExamValidationException ex) {
            throw new ExamValidationException(ex.getValidationErrors().entrySet().stream().collect(Collectors.toMap(
                    e -> e.getKey().replace("answerVisibilityScore", "threshold"), Map.Entry::getValue)));
        }
        if (source.threshold() != null && source.threshold().compareTo(exam.getMaxScore()) > 0) {
            fail("assignment.threshold", "Điểm ngưỡng không được vượt quá tổng điểm đề");
        }
        var basic = request.basicInfo();
        var subject = subjectRepository.findById(basic.subjectId()).orElse(null);
        if (subject == null) fail("basicInfo.subjectId", "Không tìm thấy môn học");
        var targets = targetValidator.validate(teacher.getId(), input);
        // Validate all input before mutating managed entities or target rows.
        exam.setSubject(subject); exam.setTitle(basic.title().trim());
        exam.setGradeLevel(basic.gradeLevel().trim()); exam.setPurpose(trim(basic.purpose()));
        exam.setDescription(trim(basic.description())); exam.setTimeLimit(basic.timeLimit());
        exam.setMaxAttempts(basic.maxAttempts()); exam.setUpdatedAt(LocalDateTime.now());
        assignment.setAssignmentType(source.assignmentType());
        assignment.setTimeLimit(null); assignment.setMaxAttempts(null);
        assignment.setScoreVisibility(source.scoreVisibility()); assignment.setAnswerVisibility(source.answerVisibility());
        assignment.setAnswerVisibilityScore(source.threshold());
        assignment.setHideCorrectAnswerOnWrong(source.hideCorrectAnswerOnWrong());
        assignment.setOpenTime(source.openTime()); assignment.setCloseTime(source.closeTime());
        syncTargets(assignment, targets);
        examRepository.flush();
        return configurationService.get(examId, username);
    }

    private void syncTargets(ExamAssignment assignment, ExamTargetValidator.Targets targets) {
        Long id = assignment.getId();
        Set<Long> oldClasses = classRepository.findAllByAssignment_IdIn(List.of(id)).stream()
                .map(c -> c.getId().getClassId()).collect(Collectors.toSet());
        Set<Long> oldStudents = studentRepository.findAllByAssignment_IdIn(List.of(id)).stream()
                .map(s -> s.getId().getStudentId()).collect(Collectors.toSet());
        Set<Long> newClasses = targets.classes().stream().map(Classroom::getId).collect(Collectors.toSet());
        Set<Long> newStudents = targets.students().stream().map(User::getId).collect(Collectors.toSet());
        var removedClasses = new HashSet<>(oldClasses); removedClasses.removeAll(newClasses);
        var removedStudents = new HashSet<>(oldStudents); removedStudents.removeAll(newStudents);
        if (!removedClasses.isEmpty()) classRepository.deleteTargets(id, removedClasses);
        if (!removedStudents.isEmpty()) studentRepository.deleteTargets(id, removedStudents);
        targets.classes().stream().filter(c -> !oldClasses.contains(c.getId())).forEach(c -> entityManager.persist(
                ExamAssignmentClass.builder().id(new ExamAssignmentClassId(id, c.getId()))
                        .assignment(assignment).classroom(c).build()));
        targets.students().stream().filter(s -> !oldStudents.contains(s.getId())).forEach(s -> entityManager.persist(
                ExamAssignmentStudent.builder().id(new ExamAssignmentStudentId(id, s.getId()))
                        .assignment(assignment).student(s).build()));
    }

    private static String trim(String text) { return text == null || text.isBlank() ? null : text.trim(); }
}

