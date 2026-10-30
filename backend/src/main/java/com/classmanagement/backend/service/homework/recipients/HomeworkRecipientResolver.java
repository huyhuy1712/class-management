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
import java.util.*;

@Service
@RequiredArgsConstructor
public class HomeworkRecipientResolver {
    private final ClassroomRepository classrooms;
    private final ClassStudentRepository classStudents;

    public HomeworkRecipientResolver.RecipientSnapshot resolveRecipients(
            Long teacherId, MaterialAssignmentType type, MaterialDistribution distribution) {
        Map<Long, Long> result = new LinkedHashMap<>();
        Map<Long, Set<Long>> recipientClasses = new LinkedHashMap<>();
        if (type == MaterialAssignmentType.STUDENT) {
            result.putAll(distribution.studentClassIds());
            distribution.studentClassIds().forEach((studentId, classId) ->
                    recipientClasses.computeIfAbsent(studentId, ignored -> new LinkedHashSet<>()).add(classId));
            return new HomeworkRecipientResolver.RecipientSnapshot(result, recipientClasses);
        }

        List<Classroom> targets = type == MaterialAssignmentType.ALL
                ? classrooms.findAllByTeacher_Id(teacherId).stream()
                        .filter(room -> room.getStatus() == ClassroomStatus.ACTIVE).toList()
                : distribution.classrooms();
        if (targets.isEmpty())
            throw new IllegalArgumentException("KhĂ´ng cĂ³ lá»›p Ä‘ang hoáº¡t Ä‘á»™ng Ä‘á»ƒ giao bĂ i táº­p");
        for (Classroom classroom : targets) {
            for (var membership : classStudents.findAllByClassroomId(classroom.getId())) {
                User student = membership.getStudent();
                if (student.getRole() == UserRole.STUDENT && student.getStatus() == UserStatus.ACTIVE) {
                    result.putIfAbsent(student.getId(), classroom.getId());
                    recipientClasses.computeIfAbsent(student.getId(), ignored -> new LinkedHashSet<>())
                            .add(classroom.getId());
                }
            }
        }
        if (result.isEmpty())
            throw new IllegalArgumentException("KhĂ´ng tĂ¬m tháº¥y há»c sinh Ä‘ang hoáº¡t Ä‘á»™ng trong pháº¡m vi Ä‘Ă£ chá»n");
        return new HomeworkRecipientResolver.RecipientSnapshot(result, recipientClasses);
    }
    public record RecipientSnapshot(Map<Long, Long> students, Map<Long, Set<Long>> classes) {}
}
