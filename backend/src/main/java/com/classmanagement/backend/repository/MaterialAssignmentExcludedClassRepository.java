package com.classmanagement.backend.repository;

import com.classmanagement.backend.entity.MaterialAssignmentExcludedClass;
import com.classmanagement.backend.entity.compositeID.MaterialAssignmentExcludedClassId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface MaterialAssignmentExcludedClassRepository
        extends JpaRepository<MaterialAssignmentExcludedClass, MaterialAssignmentExcludedClassId> {

    List<MaterialAssignmentExcludedClass> findAllById_AssignmentIdIn(Collection<Long> assignmentIds);

    List<MaterialAssignmentExcludedClass> findAllByClassroom_Id(Long classId);

    boolean existsById_AssignmentIdAndId_ClassId(Long assignmentId, Long classId);
}
