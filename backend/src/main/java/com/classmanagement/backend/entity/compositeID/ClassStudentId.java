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
public class ClassStudentId implements Serializable {

    @Column(name = "class_id")
    private Long classId;

    @Column(name = "student_id")
    private Long studentId;
}