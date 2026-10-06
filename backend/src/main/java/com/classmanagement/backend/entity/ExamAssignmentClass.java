package com.classmanagement.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import com.classmanagement.backend.entity.compositeID.ExamAssignmentClassId;

@Entity
@Table(name = "exam_assignment_classes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamAssignmentClass {

    @EmbeddedId
    private ExamAssignmentClassId id;

    @MapsId("assignmentId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assignment_id", nullable = false)
    private ExamAssignment assignment;

    @MapsId("classId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "class_id", nullable = false)
    private Classroom classroom;
}