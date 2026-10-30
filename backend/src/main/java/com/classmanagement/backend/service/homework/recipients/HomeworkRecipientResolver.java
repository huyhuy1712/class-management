package com.classmanagement.backend.service.homework.recipients;

import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.ClassroomStatus;
import com.classmanagement.backend.entity.enums.MaterialAssignmentType;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import com.classmanagement.backend.repository.classroom.ClassroomRepository;
import com.classmanagement.backend.service.impl.material.MaterialDistribution;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class HomeworkRecipientResolver {
    private final ClassroomRepository classrooms;
    private final ClassStudentRepository classStudents;

    public RecipientSnapshot resolve(Long teacherId, MaterialAssignmentType type, MaterialDistribution distribution) {
        Map<Long, Long> students = new LinkedHashMap<>();
        Map<Long, Set<Long>> recipientClasses = new LinkedHashMap<>();
        if (type == MaterialAssignmentType.STUDENT) {
            students.putAll(distribution.studentClassIds());
            distribution.studentClassIds().forEach((studentId, classId) ->
                    recipientClasses.computeIfAbsent(studentId, ignored -> new LinkedHashSet<>()).add(classId));
            return new RecipientSnapshot(students, recipientClasses);
        }

        List<Classroom> targets = type == MaterialAssignmentType.ALL
                ? classrooms.findAllByTeacher_Id(teacherId).stream()
                        .filter(room -> room.getStatus() == ClassroomStatus.ACTIVE).toList()
                : distribution.classrooms();
        if (targets.isEmpty())
            throw new IllegalArgumentException("Không có lớp đang hoạt động để giao bài tập");

        for (Classroom classroom : targets) {
            for (var membership : classStudents.findAllByClassroomId(classroom.getId())) {
                User student = membership.getStudent();
                if (student.getRole() == UserRole.STUDENT && student.getStatus() == UserStatus.ACTIVE) {
                    students.putIfAbsent(student.getId(), classroom.getId());
                    recipientClasses.computeIfAbsent(student.getId(), ignored -> new LinkedHashSet<>())
                            .add(classroom.getId());
                }
            }
        }
        if (students.isEmpty())
            throw new IllegalArgumentException("Không tìm thấy học sinh đang hoạt động trong phạm vi đã chọn");
        return new RecipientSnapshot(students, recipientClasses);
    }

    public record RecipientSnapshot(Map<Long, Long> students, Map<Long, Set<Long>> classes) {}
}
