package com.classmanagement.backend.entity.compositeID;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class MaterialAssignmentExcludedClassId implements Serializable {

    @Column(name = "assignment_id")
    private Long assignmentId;

    @Column(name = "class_id")
    private Long classId;
}
