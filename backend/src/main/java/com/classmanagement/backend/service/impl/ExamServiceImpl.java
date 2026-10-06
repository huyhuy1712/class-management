package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.exam.ExamListResponse;
import com.classmanagement.backend.entity.Exam;
import com.classmanagement.backend.entity.ExamAssignment;
import com.classmanagement.backend.entity.ExamAssignmentClass;
import com.classmanagement.backend.entity.ExamAttempt;
import com.classmanagement.backend.entity.enums.ExamAttemptStatus;
import com.classmanagement.backend.repository.exam.ExamAssignmentClassRepository;
import com.classmanagement.backend.repository.exam.ExamAssignmentRepository;
import com.classmanagement.backend.repository.exam.ExamAttemptRepository;
import com.classmanagement.backend.repository.exam.ExamRepository;
import com.classmanagement.backend.service.ExamService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ExamServiceImpl implements ExamService {

    private final ExamRepository examRepository;
    private final ExamAssignmentRepository examAssignmentRepository;
    private final ExamAssignmentClassRepository examAssignmentClassRepository;
    private final ExamAttemptRepository examAttemptRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ExamListResponse> getMyExams(String username) {

        // Query 1: lấy toàn bộ Exam của teacher hiện tại
        List<Exam> exams = examRepository.findAllByTeacher_Username(username);

        if (exams.isEmpty()) {
            return List.of();
        }

        List<Long> examIds = exams.stream()
                .map(Exam::getId)
                .toList();

        // Query 2: batch load Assignment của toàn bộ Exam
        List<ExamAssignment> assignments = examAssignmentRepository.findAllByExam_IdIn(examIds);

        if (assignments.isEmpty()) {
            return exams.stream()
                    .map(exam -> toResponse(exam, 0L, 0L))
                    .toList();
        }

        List<Long> assignmentIds = assignments.stream()
                .map(ExamAssignment::getId)
                .toList();

        /*
         * Mapping:
         *
         * assignmentId -> examId
         *
         * Dùng map này để các bước sau không phải truy cập ngược
         * assignment.getExam() nhiều lần.
         */
        Map<Long, Long> examIdByAssignmentId = new HashMap<>();

        for (ExamAssignment assignment : assignments) {
            examIdByAssignmentId.put(
                    assignment.getId(),
                    assignment.getExam().getId());
        }

        // Query 3: batch load toàn bộ class assignment
        List<ExamAssignmentClass> assignmentClasses = examAssignmentClassRepository
                .findAllByAssignment_IdIn(assignmentIds);

        /*
         * examId -> Set<classId>
         *
         * Dùng Set để cùng một class không bị count 2 lần nếu Exam
         * từng có nhiều Assignment liên quan tới class đó.
         */
        Map<Long, Set<Long>> classIdsByExamId = new HashMap<>();

        for (ExamAssignmentClass assignmentClass : assignmentClasses) {

            Long assignmentId = assignmentClass.getId().getAssignmentId();

            Long examId = examIdByAssignmentId.get(assignmentId);

            if (examId == null) {
                continue;
            }

            classIdsByExamId
                    .computeIfAbsent(
                            examId,
                            ignored -> new HashSet<>())
                    .add(assignmentClass.getId().getClassId());
        }

        // Query 4: chỉ lấy Attempt đã nộp / đã chấm
        List<ExamAttempt> submittedAttempts = examAttemptRepository
                .findAllByAssignment_IdInAndStatusIn(
                        assignmentIds,
                        List.of(
                                ExamAttemptStatus.SUBMITTED,
                                ExamAttemptStatus.GRADED));

        /*
         * examId -> submittedCount
         */
        Map<Long, Long> submittedCountByExamId = new HashMap<>();

        for (ExamAttempt attempt : submittedAttempts) {

            Long assignmentId = attempt.getAssignment().getId();

            Long examId = examIdByAssignmentId.get(assignmentId);

            if (examId == null) {
                continue;
            }

            submittedCountByExamId.merge(
                    examId,
                    1L,
                    Long::sum);
        }

        // Không query DB thêm từ đây.
        return exams.stream()
                .map(exam -> {

                    long submittedCount = submittedCountByExamId.getOrDefault(
                            exam.getId(),
                            0L);

                    long assignedClassCount = classIdsByExamId
                            .getOrDefault(
                                    exam.getId(),
                                    Set.of())
                            .size();

                    return toResponse(
                            exam,
                            submittedCount,
                            assignedClassCount);
                })
                .toList();
    }

    private ExamListResponse toResponse(
            Exam exam,
            long submittedCount,
            long assignedClassCount) {
        return new ExamListResponse(
                exam.getId(),
                exam.getTitle(),
                exam.getCode(),
                submittedCount,
                exam.getStatus(),
                assignedClassCount,
                exam.getCreatedAt());
    }
}