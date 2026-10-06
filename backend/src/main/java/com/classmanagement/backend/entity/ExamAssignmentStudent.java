package com.classmanagement.backend.entity;

import com.classmanagement.backend.entity.compositeID.ExamAssignmentStudentId;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "exam_assignment_students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamAssignmentStudent {

    @EmbeddedId
    private ExamAssignmentStudentId id;

    @MapsId("assignmentId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assignment_id", nullable = false)
    private ExamAssignment assignment;

    @MapsId("studentId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;
}
