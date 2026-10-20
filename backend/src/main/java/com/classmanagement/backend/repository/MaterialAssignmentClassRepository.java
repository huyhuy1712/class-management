package com.classmanagement.backend.repository;

import com.classmanagement.backend.entity.MaterialAssignmentClass;
import com.classmanagement.backend.entity.compositeID.MaterialAssignmentClassId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface MaterialAssignmentClassRepository
        extends JpaRepository<MaterialAssignmentClass, MaterialAssignmentClassId> {

    List<MaterialAssignmentClass> findAllById_AssignmentIdIn(Collection<Long> assignmentIds);

    List<MaterialAssignmentClass> findAllByClassroom_Id(Long classId);

}
