package com.classmanagement.backend.service.impl.material;

import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.entity.MaterialAssignment;
import com.classmanagement.backend.entity.MaterialAssignmentClass;
import com.classmanagement.backend.entity.MaterialAssignmentExcludedClass;
import com.classmanagement.backend.entity.MaterialAssignmentStudent;
import com.classmanagement.backend.entity.Material;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.compositeID.MaterialAssignmentClassId;
import com.classmanagement.backend.entity.compositeID.MaterialAssignmentStudentId;
import com.classmanagement.backend.entity.enums.ClassroomStatus;
import com.classmanagement.backend.entity.enums.MaterialAssignmentType;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.repository.MaterialAssignmentClassRepository;
import com.classmanagement.backend.repository.MaterialAssignmentExcludedClassRepository;
import com.classmanagement.backend.repository.MaterialAssignmentRepository;
import com.classmanagement.backend.repository.MaterialAssignmentStudentRepository;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import com.classmanagement.backend.repository.classroom.ClassroomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class MaterialAssignmentManager {
    private final MaterialAssignmentRepository assignmentRepository;
    private final MaterialAssignmentClassRepository assignmentClassRepository;
    private final MaterialAssignmentExcludedClassRepository excludedClassRepository;
    private final MaterialAssignmentStudentRepository assignmentStudentRepository;
    private final ClassroomRepository classroomRepository;
    private final ClassStudentRepository classStudentRepository;
    private final UserRepository userRepository;

    public MaterialDistribution validateDistribution(
            Long teacherId,
            MaterialAssignmentType assignmentType,
            List<Long> requestedClassIds,
            List<Long> requestedStudentIds) {
        if (assignmentType == null) {
            throw new IllegalArgumentException("Vui lòng chọn phạm vi phân phối");
        }
        List<Long> classIds = distinctIds(requestedClassIds);
        List<Long> studentIds = distinctIds(requestedStudentIds);

        if (assignmentType == MaterialAssignmentType.ALL) {
            if (!classIds.isEmpty() || !studentIds.isEmpty()) {
                throw new IllegalArgumentException("Phạm vi Tất cả không nhận danh sách lớp hoặc học sinh");
            }
            return new MaterialDistribution(List.of(), List.of(), Map.of());
        }

        if (assignmentType == MaterialAssignmentType.CLASS) {
            if (classIds.isEmpty() || !studentIds.isEmpty()) {
                throw new IllegalArgumentException("Hãy chọn ít nhất một lớp để phân phối");
            }
            List<Classroom> classrooms = classroomRepository.findAllByIdInAndTeacher_Id(classIds, teacherId)
                    .stream()
                    .filter(classroom -> classroom.getStatus() == ClassroomStatus.ACTIVE)
                    .toList();
            if (classrooms.size() != classIds.size()) {
                throw new IllegalArgumentException(
                        "Có lớp không tồn tại, không hoạt động hoặc không thuộc quyền của bạn");
            }
            return new MaterialDistribution(classrooms, List.of(), Map.of());
        }

        if (!classIds.isEmpty() || studentIds.isEmpty()) {
            throw new IllegalArgumentException("Hãy chọn ít nhất một học sinh");
        }
        List<Classroom> activeClassrooms = classroomRepository.findAllByTeacher_Id(teacherId).stream()
                .filter(classroom -> classroom.getStatus() == ClassroomStatus.ACTIVE)
                .toList();
        if (activeClassrooms.isEmpty()) {
            throw new IllegalArgumentException("Bạn chưa có lớp đang hoạt động để phân phối tài liệu");
        }
        List<Long> activeClassIds = activeClassrooms.stream().map(Classroom::getId).toList();
        List<ClassStudentRepository.StudentClassPair> membershipPairs =
                classStudentRepository.findStudentClassPairs(activeClassIds, studentIds);
        Map<Long, Long> studentClassIds = new HashMap<>();
        membershipPairs.stream()
                .sorted(Comparator.comparing(ClassStudentRepository.StudentClassPair::getClassId))
                .forEach(pair -> studentClassIds.putIfAbsent(pair.getStudentId(), pair.getClassId()));

        List<User> students = userRepository.findAllById(studentIds).stream()
                .filter(student -> student.getRole() == UserRole.STUDENT && student.getStatus() == UserStatus.ACTIVE)
                .toList();
        Set<Long> activeStudentIds = students.stream().map(User::getId).collect(Collectors.toSet());
        if (activeStudentIds.size() != studentIds.size()
                || !studentClassIds.keySet().containsAll(studentIds)) {
            throw new IllegalArgumentException(
                    "Có học sinh không tồn tại, không hoạt động hoặc không thuộc lớp bạn phụ trách");
        }

        List<Classroom> referencedClassrooms = activeClassrooms.stream()
                .filter(classroom -> studentClassIds.containsValue(classroom.getId()))
                .toList();
        return new MaterialDistribution(referencedClassrooms, students, studentClassIds);
    }

    public void replaceTargets(
            MaterialAssignment assignment,
            MaterialAssignmentType assignmentType,
            MaterialDistribution distribution) {
        replaceTargets(List.of(assignment), assignmentType, distribution);
    }

    public void replaceTargets(
            List<MaterialAssignment> assignments,
            MaterialAssignmentType assignmentType,
            MaterialDistribution distribution) {
        if (assignmentType == MaterialAssignmentType.CLASS) {
            assignmentClassRepository.saveAll(assignments.stream()
                    .flatMap(assignment -> distribution.classrooms().stream()
                            .map(classroom -> MaterialAssignmentClass.builder()
                                    .id(new MaterialAssignmentClassId(assignment.getId(), classroom.getId()))
                                    .assignment(assignment)
                                    .classroom(classroom)
                                    .build()))
                    .toList());
        } else if (assignmentType == MaterialAssignmentType.STUDENT) {
            Map<Long, User> studentsById = distribution.students().stream()
                    .collect(Collectors.toMap(User::getId, Function.identity()));
            Map<Long, Classroom> classroomsById = distribution.classrooms().stream()
                    .collect(Collectors.toMap(Classroom::getId, Function.identity()));
            assignmentStudentRepository.saveAll(assignments.stream()
                    .flatMap(assignment -> distribution.studentClassIds().entrySet().stream()
                            .map(entry -> {
                                User student = studentsById.get(entry.getKey());
                                Classroom classroom = classroomsById.get(entry.getValue());
                                return MaterialAssignmentStudent.builder()
                                        .id(new MaterialAssignmentStudentId(assignment.getId(), student.getId()))
                                        .assignment(assignment)
                                        .student(student)
                                        .classroom(classroom)
                                        .build();
                            }))
                    .toList());
        }
        assignmentClassRepository.flush();
        assignmentStudentRepository.flush();
    }

    @Transactional
    public void updateAssignment(
            Material material,
            MaterialAssignmentType assignmentType,
            MaterialDistribution distribution) {
        MaterialAssignment assignment = assignmentRepository.findByMaterial_Id(material.getId())
                .orElseGet(() -> MaterialAssignment.builder()
                        .material(material)
                        .assignmentType(assignmentType)
                        .build());
        assignmentRepository.saveAndFlush(assignment);
        assignmentClassRepository.deleteAll(
                assignmentClassRepository.findAllById_AssignmentIdIn(List.of(assignment.getId())));
        assignmentStudentRepository.deleteAll(
                assignmentStudentRepository.findAllById_AssignmentIdIn(List.of(assignment.getId())));
        excludedClassRepository.deleteAll(
                excludedClassRepository.findAllById_AssignmentIdIn(List.of(assignment.getId())));
        assignment.setAssignmentType(assignmentType);
        assignmentRepository.saveAndFlush(assignment);
        replaceTargets(assignment, assignmentType, distribution);
    }

    @Transactional
    public void cleanupClassAssignments(Long classroomId) {
        List<MaterialAssignmentClass> removedTargets = assignmentClassRepository.findAllByClassroom_Id(classroomId);
        Set<Long> assignmentIds = removedTargets.stream()
                .map(target -> target.getId().getAssignmentId())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (assignmentIds.isEmpty()) {
            return;
        }

        List<MaterialAssignmentClass> allTargets = assignmentClassRepository
                .findAllById_AssignmentIdIn(assignmentIds);
        Map<Long, Long> targetCounts = allTargets.stream().collect(Collectors.groupingBy(
                target -> target.getId().getAssignmentId(), Collectors.counting()));
        Map<Long, MaterialAssignment> assignments = assignmentRepository.findAllByIdIn(assignmentIds).stream()
                .collect(Collectors.toMap(MaterialAssignment::getId, Function.identity()));
        Set<Long> orphanedAssignmentIds = new LinkedHashSet<>();
        for (MaterialAssignmentClass target : removedTargets) {
            Long assignmentId = target.getId().getAssignmentId();
            if (targetCounts.getOrDefault(assignmentId, 0L) <= 1) {
                orphanedAssignmentIds.add(assignmentId);
            } else {
                assignmentClassRepository.delete(target);
            }
        }
        if (!orphanedAssignmentIds.isEmpty()) {
            assignmentRepository.deleteAll(orphanedAssignmentIds.stream()
                    .map(assignments::get)
                    .filter(assignment -> assignment != null)
                    .toList());
        }
    }

    @Transactional
    public void cleanupStudentAssignments(Long studentId) {
        cleanupStudentTargets(assignmentStudentRepository.findAllByStudent_Id(studentId));
    }

    @Transactional
    public void cleanupStudentAssignmentsForMembership(Long classroomId, Long studentId) {
        cleanupStudentTargets(assignmentStudentRepository
                .findAllById_StudentIdAndClassroom_Id(studentId, classroomId));
    }

    @Transactional
    public void cleanupStudentAssignmentsForClass(Long classroomId) {
        cleanupStudentTargets(assignmentStudentRepository.findAllByClassroom_Id(classroomId));
    }

    private List<Long> distinctIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        if (ids.stream().anyMatch(id -> id == null || id <= 0)) {
            throw new IllegalArgumentException("Danh sách đích phân phối không hợp lệ");
        }
        return new ArrayList<>(new LinkedHashSet<>(ids));
    }

    private void cleanupStudentTargets(List<MaterialAssignmentStudent> removedTargets) {
        if (removedTargets.isEmpty()) {
            return;
        }
        Set<Long> assignmentIds = removedTargets.stream()
                .map(target -> target.getId().getAssignmentId())
                .collect(Collectors.toCollection(LinkedHashSet::new));
        assignmentStudentRepository.deleteAll(removedTargets);
        assignmentStudentRepository.flush();
        Set<Long> assignmentsWithRemainingTargets = assignmentStudentRepository
                .findAllById_AssignmentIdIn(assignmentIds).stream()
                .map(target -> target.getId().getAssignmentId())
                .collect(Collectors.toSet());
        Set<Long> orphanedAssignmentIds = assignmentIds.stream()
                .filter(id -> !assignmentsWithRemainingTargets.contains(id))
                .collect(Collectors.toSet());
        if (!orphanedAssignmentIds.isEmpty()) {
            List<MaterialAssignment> assignments = assignmentRepository.findAllByIdIn(orphanedAssignmentIds);
            assignmentRepository.deleteAll(assignments);
        }
    }
}
