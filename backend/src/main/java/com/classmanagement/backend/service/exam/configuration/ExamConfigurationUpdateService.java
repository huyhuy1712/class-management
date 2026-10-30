package com.classmanagement.backend.service.exam.configuration;

import static com.classmanagement.backend.service.exam.validation.ExamStructureValidator.fail;

import com.classmanagement.backend.dto.exam.*;
import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.compositeID.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.exception.*;
import com.classmanagement.backend.repository.SubjectRepository;
import com.classmanagement.backend.repository.exam.*;
import com.classmanagement.backend.service.exam.validation.ExamStructureValidator;
import com.classmanagement.backend.service.exam.validation.ExamTargetValidator;
import com.classmanagement.backend.service.billing.TeacherEntitlementService;

import jakarta.persistence.EntityManager;
import jakarta.validation.Validator;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

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
    private final ExamAttemptDataRepository attemptData;
        private final TeacherEntitlementService entitlements;

    @Transactional
    public ExamConfigurationResponse createAssignment(
            Long examId, String username, CreateExamAssignmentRequest request) {
        if (examId == null || examId <= 0)
            throw new IllegalArgumentException("examId phải là số nguyên dương.");
        if (request == null) fail("request", "Thiếu dữ liệu lần giao mới");
        Map<String, String> errors = new LinkedHashMap<>();
        validator
                .validate(request)
                .forEach(v -> errors.put(v.getPropertyPath().toString(), v.getMessage()));
        if (!errors.isEmpty()) throw new ExamValidationException(errors);
        var exam =
                examRepository
                        .findLockedByIdAndTeacher_Username(examId, username)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi."));
        if (exam.getTeacher().getRole() != UserRole.TEACHER
                || exam.getTeacher().getStatus() != UserStatus.ACTIVE) {
            throw new IllegalStateException("Chỉ giáo viên đang hoạt động được giao lại đề.");
        }
        if (assignmentRepository
                .findByExam_IdAndCreationRequestId(examId, request.requestId())
                .isPresent()) return configurationService.get(examId, username);
        if (exam.getStatus() != ExamStatus.PUBLISHED)
            throw new ConflictException("Chỉ đề đã xuất bản được mở đợt thi mới.");
        var input = request.assignment();
        entitlements.requireAttemptLimit(exam.getTeacher().getId(), request.maxAttempts());
        structureValidator.validateAssignment(input);
        if (input.answerVisibilityScore() != null
                && input.answerVisibilityScore().compareTo(exam.getMaxScore()) > 0)
            fail("assignment.answerVisibilityScore", "Ngưỡng xem đáp án vượt tổng điểm đề");
        var now = LocalDateTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
        if (input.closeTime() != null && !input.closeTime().isAfter(now))
            fail("assignment.closeTime", "Thời gian đóng đợt mới phải ở tương lai");
        var targets = targetValidator.validate(exam.getTeacher().getId(), input);
        var assignment =
                assignmentRepository.save(
                        ExamAssignment.builder()
                                .exam(exam)
                                .creationRequestId(request.requestId())
                                .assignmentType(input.assignmentType())
                                .timeLimit(request.timeLimit())
                                .maxAttempts(request.maxAttempts())
                                .openTime(input.openTime())
                                .closeTime(input.closeTime())
                                .scoreVisibility(input.scoreVisibility())
                                .answerVisibility(input.answerVisibility())
                                .answerVisibilityScore(input.answerVisibilityScore())
                                .hideCorrectAnswerOnWrong(input.hideCorrectAnswerOnWrong())
                                .status(
                                        input.openTime() != null && input.openTime().isAfter(now)
                                                ? ExamAssignmentStatus.SCHEDULED
                                                : ExamAssignmentStatus.OPEN)
                                .build());
        syncTargets(assignment, targets);
        assignmentRepository.flush();
        attemptData.snapshotAssignment(assignment.getId());
        return configurationService.get(examId, username);
    }

    @Transactional
    public ExamConfigurationResponse updateResultSettings(
            Long examId,
            Long assignmentId,
            String username,
            UpdateAssignmentResultSettingsRequest request) {
        if (examId == null || examId <= 0 || assignmentId == null || assignmentId <= 0)
            throw new IllegalArgumentException("examId và assignmentId phải là số nguyên dương.");
        if (request == null) fail("request", "Thiếu cài đặt hiển thị kết quả");
        Map<String, String> errors = new LinkedHashMap<>();
        validator.validate(request)
                .forEach(v -> errors.put(v.getPropertyPath().toString(), v.getMessage()));
        if (!errors.isEmpty()) throw new ExamValidationException(errors);

        var exam = examRepository.findLockedByIdAndTeacher_Username(examId, username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi."));
        if (exam.getTeacher().getRole() != UserRole.TEACHER
                || exam.getTeacher().getStatus() != UserStatus.ACTIVE) {
            throw new IllegalStateException("Chỉ giáo viên đang hoạt động được sửa cài đặt kết quả.");
        }
        if (exam.getStatus() != ExamStatus.PUBLISHED)
            throw new ConflictException("Chỉ đề thi đã xuất bản được sửa cài đặt kết quả.");

        var assignment = assignmentRepository.findLockedByIdAndExam_Id(assignmentId, examId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lần giao của đề thi."));
        assignment.setScoreVisibility(request.scoreVisibility());
        assignment.setAnswerVisibility(request.answerVisibility());
        assignment.setHideCorrectAnswerOnWrong(request.hideCorrectAnswerOnWrong());
        assignmentRepository.flush();
        return configurationService.get(examId, username);
    }

    @Transactional
    public ExamConfigurationResponse update(
            Long examId, String username, UpdateExamRequest request) {
        if (examId == null || examId <= 0)
            throw new IllegalArgumentException("examId phải là số nguyên dương.");
        if (request == null) fail("request", "Thiếu dữ liệu cấu hình");
        Map<String, String> errors = new LinkedHashMap<>();
        validator
                .validate(request)
                .forEach(v -> errors.put(v.getPropertyPath().toString(), v.getMessage()));
        if (!errors.isEmpty()) throw new ExamValidationException(errors);
        var exam =
                examRepository
                        .findLockedByIdAndTeacher_Username(examId, username)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi."));
        if (exam.getStatus() != ExamStatus.DRAFT)
            throw new ConflictException("Chỉ đề thi DRAFT được sửa cấu hình.");
        if (request.revision() != null && !request.revision().equals(exam.getRevision())) {
            throw new ConflictException("Đề thi đã thay đổi, vui lòng tải lại trước khi lưu.");
        }
        var source = request.assignment();
        ExamAssignment assignment = null;
        if (source.id() == null) {
            if (assignmentRepository.existsByExam_Id(examId)) {
                throw new ConflictException(
                        "Đề đã có lần giao. Vui lòng tải lại cấu hình trước khi lưu.");
            }
        } else {
            assignment =
                    assignmentRepository
                            .findLockedByIdAndExam_Id(source.id(), examId)
                            .orElseThrow(
                                    () ->
                                            new ResourceNotFoundException(
                                                    "Không tìm thấy lần giao của đề thi."));
            if (assignment.getStatus() != ExamAssignmentStatus.DRAFT
                    || attemptRepository.existsByAssignment_Id(source.id())) {
                throw new ConflictException(
                        "Lần giao đã hoạt động hoặc có lượt làm, không thể sửa cấu hình.");
            }
        }
        var teacher = exam.getTeacher();
        if (teacher.getRole() != UserRole.TEACHER || teacher.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalStateException("Chỉ giáo viên đang hoạt động được sửa cấu hình.");
        }
        var input = source.toCreateAssignment();
        try {
            structureValidator.validateAssignment(input);
        } catch (ExamValidationException ex) {
            throw new ExamValidationException(
                    ex.getValidationErrors().entrySet().stream()
                            .collect(
                                    Collectors.toMap(
                                            e ->
                                                    e.getKey()
                                                            .replace(
                                                                    "answerVisibilityScore",
                                                                    "threshold"),
                                            Map.Entry::getValue)));
        }
        if (source.threshold() != null && source.threshold().compareTo(exam.getMaxScore()) > 0) {
            fail("assignment.threshold", "Điểm ngưỡng không được vượt quá tổng điểm đề");
        }
        var basic = request.basicInfo();
        entitlements.requireAttemptLimit(teacher.getId(), basic.maxAttempts());
        var subject = subjectRepository.findById(basic.subjectId()).orElse(null);
        if (subject == null) fail("basicInfo.subjectId", "Không tìm thấy môn học");
        var targets = targetValidator.validate(teacher.getId(), input);
        // Validate all input before mutating managed entities or target rows.
        exam.setSubject(subject);
        exam.setTitle(basic.title().trim());
        exam.setGradeLevel(basic.gradeLevel().trim());
        exam.setPurpose(trim(basic.purpose()));
        exam.setDescription(trim(basic.description()));
        exam.setTimeLimit(basic.timeLimit());
        exam.setMaxAttempts(basic.maxAttempts());
        exam.setUpdatedAt(LocalDateTime.now());
        boolean createAssignment = assignment == null;
        if (createAssignment) {
            assignment =
                    assignmentRepository.save(
                            ExamAssignment.builder()
                                    .exam(exam)
                                    .assignmentType(source.assignmentType())
                                    .status(ExamAssignmentStatus.DRAFT)
                                    .build());
        }
        assignment.setAssignmentType(source.assignmentType());
        assignment.setTimeLimit(null);
        assignment.setMaxAttempts(null);
        assignment.setScoreVisibility(source.scoreVisibility());
        assignment.setAnswerVisibility(source.answerVisibility());
        assignment.setAnswerVisibilityScore(source.threshold());
        assignment.setHideCorrectAnswerOnWrong(source.hideCorrectAnswerOnWrong());
        assignment.setOpenTime(source.openTime());
        assignment.setCloseTime(source.closeTime());
        syncTargets(assignment, targets);
        examRepository.flush();
        return configurationService.get(examId, username);
    }

    private void syncTargets(ExamAssignment assignment, ExamTargetValidator.Targets targets) {
        Long id = assignment.getId();
        Set<Long> oldClasses =
                classRepository.findAllByAssignment_IdIn(List.of(id)).stream()
                        .map(c -> c.getId().getClassId())
                        .collect(Collectors.toSet());
        var studentRows = studentRepository.findAllByAssignment_IdIn(List.of(id));
        Set<Long> oldStudents =
                studentRows.stream().map(s -> s.getId().getStudentId()).collect(Collectors.toSet());
        Set<Long> newClasses =
                targets.classes().stream().map(Classroom::getId).collect(Collectors.toSet());
        Set<Long> newStudents =
                targets.students().stream().map(User::getId).collect(Collectors.toSet());
        var removedClasses = new HashSet<>(oldClasses);
        removedClasses.removeAll(newClasses);
        var removedStudents = new HashSet<>(oldStudents);
        removedStudents.removeAll(newStudents);
        if (!removedClasses.isEmpty()) classRepository.deleteTargets(id, removedClasses);
        if (!removedStudents.isEmpty()) studentRepository.deleteTargets(id, removedStudents);
        studentRows.stream()
                .filter(s -> newStudents.contains(s.getId().getStudentId()))
                .forEach(s -> s.setClassroom(targets.classroom()));
        targets.classes().stream()
                .filter(c -> !oldClasses.contains(c.getId()))
                .forEach(
                        c ->
                                entityManager.persist(
                                        ExamAssignmentClass.builder()
                                                .id(new ExamAssignmentClassId(id, c.getId()))
                                                .assignment(assignment)
                                                .classroom(c)
                                                .build()));
        targets.students().stream()
                .filter(s -> !oldStudents.contains(s.getId()))
                .forEach(
                        s ->
                                entityManager.persist(
                                        ExamAssignmentStudent.builder()
                                                .id(new ExamAssignmentStudentId(id, s.getId()))
                                                .assignment(assignment)
                                                .student(s)
                                                .classroom(targets.classroom())
                                                .build()));
    }

    private static String trim(String text) {
        return text == null || text.isBlank() ? null : text.trim();
    }
}
