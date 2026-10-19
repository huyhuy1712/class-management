package com.classmanagement.backend.entity;

import com.classmanagement.backend.entity.compositeID.MaterialAssignmentStudentId;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "material_assignment_students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaterialAssignmentStudent {

    @EmbeddedId
    private MaterialAssignmentStudentId id;

    @MapsId("assignmentId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assignment_id", nullable = false)
    private MaterialAssignment assignment;

    @MapsId("studentId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    private Classroom classroom;
}
