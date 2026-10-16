package com.classmanagement.backend.service.exam.validation;

import static com.classmanagement.backend.service.exam.validation.ExamStructureValidator.fail;

import com.classmanagement.backend.dto.exam.CreateCompleteExamRequest;
import com.classmanagement.backend.dto.exam.ExamConfigurationResponse;
import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.classroom.*;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamTargetValidator {
    private final ClassroomRepository classroomRepository;
    private final ClassStudentRepository classStudentRepository;
    private final UserRepository userRepository;

    public Targets validate(Long teacherId, CreateCompleteExamRequest.Assignment assignment) {
        List<Classroom> classes = List.of();
        List<User> students = List.of();
        Classroom context = null;
        if (assignment.assignmentType() == ExamAssignmentType.CLASS) {
            classes = classroomRepository.findAllById(assignment.classIds());
            if (classes.size() != assignment.classIds().size()
                    || classes.stream()
                            .anyMatch(
                                    c ->
                                            !c.getTeacher().getId().equals(teacherId)
                                                    || c.getStatus() != ClassroomStatus.ACTIVE)) {
                fail(
                        "assignment.classIds",
                        "Lớp không tồn tại, đã lưu trữ hoặc không thuộc giáo viên");
            }
        } else if (assignment.assignmentType() == ExamAssignmentType.STUDENT) {
            students = userRepository.findAllById(assignment.studentIds());
            Set<Long> allowed =
                    new HashSet<>(
                            classStudentRepository.findAssignableStudentIds(
                                    teacherId, assignment.studentIds()));
            if (students.size() != assignment.studentIds().size()
                    || students.stream()
                            .anyMatch(
                                    s ->
                                            s.getRole() != UserRole.STUDENT
                                                    || s.getStatus() != UserStatus.ACTIVE
                                                    || !allowed.contains(s.getId()))) {
                fail(
                        "assignment.studentIds",
                        "Học sinh không hoạt động hoặc không thuộc lớp đang phụ trách");
            }
            if (assignment.classId() != null) {
                context = classroomRepository.findById(assignment.classId()).orElse(null);
                if (context == null
                        || !context.getTeacher().getId().equals(teacherId)
                        || context.getStatus() != ClassroomStatus.ACTIVE) {
                    fail(
                            "assignment.classId",
                            "Lớp ngữ cảnh không tồn tại, đã lưu trữ hoặc không thuộc giáo viên");
                }
                Set<Long> members =
                        new HashSet<>(
                                classStudentRepository.findStudentIdsInClass(
                                        assignment.classId(), assignment.studentIds()));
                if (!members.containsAll(assignment.studentIds())) {
                    fail("assignment.studentIds", "Học sinh phải thuộc lớp ngữ cảnh đã chọn");
                }
            }
        }
        return new Targets(classes, students, context);
    }

    public record Targets(List<Classroom> classes, List<User> students, Classroom classroom) {
        public Targets(List<Classroom> classes, List<User> students) {
            this(classes, students, null);
        }
    }

    public void validateForPublication(
            Long teacherId, List<ExamConfigurationResponse.Assignment> assignments) {
        Set<Long> classIds = new HashSet<>(), studentIds = new HashSet<>();
        for (var a : assignments) {
            classIds.addAll(a.classIds());
            studentIds.addAll(a.studentIds());
            a.studentClasses().stream()
                    .map(ExamConfigurationResponse.StudentClassContext::classId)
                    .filter(Objects::nonNull)
                    .forEach(classIds::add);
        }
        var classes =
                classIds.isEmpty()
                        ? List.<Classroom>of()
                        : classroomRepository.findAllById(classIds);
        if (classes.size() != classIds.size()
                || classes.stream()
                        .anyMatch(
                                c ->
                                        c.getStatus() != ClassroomStatus.ACTIVE
                                                || !teacherId.equals(c.getTeacher().getId()))) {
            fail(
                    "assignments",
                    "Lớp mục tiêu/ngữ cảnh không tồn tại, đã lưu trữ hoặc không thuộc giáo viên");
        }
        if (!studentIds.isEmpty()) {
            var students = userRepository.findAllById(studentIds);
            Set<Long> allowed =
                    new HashSet<>(
                            classStudentRepository.findAssignableStudentIds(teacherId, studentIds));
            if (students.size() != studentIds.size()
                    || students.stream()
                            .anyMatch(
                                    s ->
                                            s.getRole() != UserRole.STUDENT
                                                    || s.getStatus() != UserStatus.ACTIVE
                                                    || !allowed.contains(s.getId()))) {
                fail("assignments", "Học sinh không hoạt động hoặc không thuộc lớp đang phụ trách");
            }
            if (!classIds.isEmpty()) {
                record Pair(Long classId, Long studentId) {}
                Set<Pair> pairs =
                        classStudentRepository.findStudentClassPairs(classIds, studentIds).stream()
                                .map(p -> new Pair(p.getClassId(), p.getStudentId()))
                                .collect(Collectors.toSet());
                for (var a : assignments)
                    for (var context : a.studentClasses()) {
                        if (context.classId() != null
                                && (!a.studentIds().contains(context.studentId())
                                        || !pairs.contains(
                                                new Pair(
                                                        context.classId(), context.studentId())))) {
                            fail("assignments", "Học sinh không còn thuộc lớp ngữ cảnh");
                        }
                    }
            }
        }
    }
}
