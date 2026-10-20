package com.classmanagement.backend.entity;

import com.classmanagement.backend.entity.compositeID.MaterialAssignmentClassId;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "material_assignment_classes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaterialAssignmentClass {

    @EmbeddedId
    private MaterialAssignmentClassId id;

    @MapsId("assignmentId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assignment_id", nullable = false)
    private MaterialAssignment assignment;

    @MapsId("classId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "class_id", nullable = false)
    private Classroom classroom;
}
