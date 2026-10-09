package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.dto.exam.ExamConfigurationResponse;
import com.classmanagement.backend.entity.ExamAssignmentClass;
import com.classmanagement.backend.entity.ExamAssignmentStudent;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.repository.exam.ExamRepository;
import com.classmanagement.backend.repository.exam.ExamAssignmentRepository;
import com.classmanagement.backend.repository.exam.ExamAssignmentClassRepository;
import com.classmanagement.backend.repository.exam.ExamAssignmentStudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamConfigurationService {
    private final ExamRepository examRepository;
    private final ExamAssignmentRepository assignmentRepository;
    private final ExamAssignmentClassRepository classRepository;
    private final ExamAssignmentStudentRepository studentRepository;

    @Transactional(readOnly = true)
    public ExamConfigurationResponse get(Long examId, String username) {
        if (examId == null || examId <= 0) {
            throw new IllegalArgumentException("examId phải là số nguyên dương.");
        }
        var exam = examRepository.findByIdAndTeacher_Username(examId, username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi."));
        var assignments = assignmentRepository.findAllByExam_Id(examId);
        var assignmentIds = assignments.stream().map(a -> a.getId()).toList();
        // Read only composite IDs: no lazy classroom/student traversal.
        Map<Long, List<Long>> classes = assignmentIds.isEmpty() ? Map.of()
                : classRepository.findAllByAssignment_IdIn(assignmentIds).stream()
                .map(ExamAssignmentClass::getId).collect(Collectors.groupingBy(
                        id -> id.getAssignmentId(), Collectors.mapping(id -> id.getClassId(), Collectors.toList())));
        Map<Long, List<Long>> students = assignmentIds.isEmpty() ? Map.of()
                : studentRepository.findAllByAssignment_IdIn(assignmentIds).stream()
                .map(ExamAssignmentStudent::getId).collect(Collectors.groupingBy(
                        id -> id.getAssignmentId(), Collectors.mapping(id -> id.getStudentId(), Collectors.toList())));
        var subject = exam.getSubject();
        return new ExamConfigurationResponse(exam.getId(), exam.getCode(), exam.getStatus(),
                exam.getMaxScore(), exam.getUpdatedAt(),
                new ExamConfigurationResponse.BasicInfo(exam.getTitle(),
                        subject == null ? null : subject.getId(), subject == null ? null : subject.getName(),
                        exam.getGradeLevel(), exam.getPurpose(), exam.getDescription(),
                        exam.getTimeLimit(), exam.getMaxAttempts()),
                assignments.stream().sorted(Comparator.comparing(a -> a.getId())).map(a ->
                        new ExamConfigurationResponse.Assignment(a.getId(), a.getStatus(), a.getAssignmentType(),
                                sortedIds(classes.get(a.getId())), sortedIds(students.get(a.getId())),
                                a.getTimeLimit(), a.getMaxAttempts(), a.getScoreVisibility(),
                                a.getAnswerVisibility(), a.getAnswerVisibilityScore(),
                                a.getHideCorrectAnswerOnWrong(), a.getOpenTime(), a.getCloseTime(),
                                a.getUpdatedAt())).toList());
    }

    private static List<Long> sortedIds(List<Long> ids) {
        return ids == null ? List.of() : ids.stream().distinct().sorted().toList();
    }
}
