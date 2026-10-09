package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.dto.exam.CreateCompleteExamRequest;
import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.classroom.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;
import static com.classmanagement.backend.service.exam.ExamStructureValidator.fail;

@Service
@RequiredArgsConstructor
public class ExamTargetValidator {
    private final ClassroomRepository classroomRepository;
    private final ClassStudentRepository classStudentRepository;
    private final UserRepository userRepository;

    public Targets validate(Long teacherId, CreateCompleteExamRequest.Assignment assignment) {
        List<Classroom> classes = List.of();
        List<User> students = List.of();
        if (assignment.assignmentType() == ExamAssignmentType.CLASS) {
            classes = classroomRepository.findAllById(assignment.classIds());
            if (classes.size() != assignment.classIds().size() || classes.stream().anyMatch(c ->
                    !c.getTeacher().getId().equals(teacherId) || c.getStatus() != ClassroomStatus.ACTIVE)) {
                fail("assignment.classIds", "Lớp không tồn tại, đã lưu trữ hoặc không thuộc giáo viên");
            }
        } else if (assignment.assignmentType() == ExamAssignmentType.STUDENT) {
            students = userRepository.findAllById(assignment.studentIds());
            Set<Long> allowed = new HashSet<>(classStudentRepository.findAssignableStudentIds(teacherId, assignment.studentIds()));
            if (students.size() != assignment.studentIds().size() || students.stream().anyMatch(s ->
                    s.getRole() != UserRole.STUDENT || s.getStatus() != UserStatus.ACTIVE || !allowed.contains(s.getId()))) {
                fail("assignment.studentIds", "Học sinh không hoạt động hoặc không thuộc lớp đang phụ trách");
            }
        }
        return new Targets(classes, students);
    }

    public record Targets(List<Classroom> classes, List<User> students) {}
}

