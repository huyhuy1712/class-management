package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.entity.Exam;
import com.classmanagement.backend.entity.ExamAssignment;
import com.classmanagement.backend.entity.ExamAssignmentClass;
import com.classmanagement.backend.entity.enums.ExamAssignmentType;
import com.classmanagement.backend.repository.exam.ExamAssignmentClassRepository;
import com.classmanagement.backend.repository.exam.ExamAssignmentRepository;
import com.classmanagement.backend.repository.exam.ExamAttemptDataRepository;
import com.classmanagement.backend.repository.exam.ExamAttemptRepository;
import com.classmanagement.backend.repository.exam.ExamMediaRepository;
import com.classmanagement.backend.repository.exam.ExamRepository;
import java.lang.reflect.Proxy;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ExamListAssignmentTargetsTest {

    private final Exam allExam = exam(1L, "Đề tất cả");
    private final Exam classExam = exam(2L, "Đề theo lớp");
    private final Exam studentExam = exam(3L, "Đề theo học sinh");

    private final List<ExamAssignment> assignments = List.of(
            assignment(11L, allExam, ExamAssignmentType.ALL),
            assignment(21L, classExam, ExamAssignmentType.CLASS),
            assignment(22L, classExam, ExamAssignmentType.CLASS),
            assignment(31L, studentExam, ExamAssignmentType.STUDENT));

    @Test
    void returnsTargetsForLatestAssignmentWithoutPerExamQueries() {
        var result = service().getMyExams("teacher").stream()
                .collect(java.util.stream.Collectors.toMap(
                        item -> item.id(),
                        item -> item.assignedTo()));

        assertEquals(List.of("Tất cả"), result.get(1L));
        assertEquals(List.of("Lớp 12A", "Lớp 12B"), result.get(2L));
        assertEquals(List.of("Nguyễn An", "Trần Bình"), result.get(3L));
    }

    private ExamServiceImpl service() {
        return new ExamServiceImpl(
                null,
                repository(ExamRepository.class),
                repository(ExamAssignmentRepository.class),
                repository(ExamAssignmentClassRepository.class),
                repository(ExamAttemptRepository.class),
                null,
                new ExamAttemptDataRepository(null));
    }

    private <T> T repository(Class<T> type) {
        return type.cast(Proxy.newProxyInstance(
                type.getClassLoader(),
                new Class<?>[] {type},
                (proxy, method, arguments) -> {
                    if (method.getName().equals("findAllByTeacher_Username")) {
                        return List.of(allExam, classExam, studentExam);
                    }
                    if (method.getName().equals("findAllByExam_IdIn")) {
                        return assignments;
                    }
                    if (method.getName().equals("findAllByAssignment_IdIn")) {
                        return List.of();
                    }
                    if (method.getName().equals("findTargetNames")) {
                        assertEquals(List.of(11L, 22L, 31L), arguments[0]);
                        return List.of(
                                target(22L, "Lớp 12A"),
                                target(22L, "Lớp 12B"),
                                target(31L, "Nguyễn An"),
                                target(31L, "Trần Bình"));
                    }
                    if (method.getName().equals("findAllByAssignment_IdInAndStatusIn")) {
                        return List.of();
                    }
                    throw new AssertionError(method.getName());
                }));
    }

    private static Exam exam(Long id, String title) {
        return Exam.builder().id(id).title(title).build();
    }

    private static ExamAssignment assignment(Long id, Exam exam, ExamAssignmentType type) {
        return ExamAssignment.builder()
                .id(id)
                .exam(exam)
                .assignmentType(type)
                .build();
    }

    private static ExamAssignmentClassRepository.AssignmentTargetName target(
            Long assignmentId,
            String name) {
        return new ExamAssignmentClassRepository.AssignmentTargetName() {
            @Override
            public Long getAssignmentId() {
                return assignmentId;
            }

            @Override
            public String getName() {
                return name;
            }
        };
    }
}
