package com.classmanagement.backend.entity.compositeID;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ExamAssignmentClassId implements Serializable {

    @Column(name = "assignment_id")
    private Long assignmentId;

    @Column(name = "class_id")
    private Long classId;
}