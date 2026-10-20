package com.classmanagement.backend.repository;

import com.classmanagement.backend.entity.MaterialAssignmentStudent;
import com.classmanagement.backend.entity.compositeID.MaterialAssignmentStudentId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MaterialAssignmentStudentRepository
        extends JpaRepository<MaterialAssignmentStudent, MaterialAssignmentStudentId> {

    List<MaterialAssignmentStudent> findAllById_AssignmentIdIn(Collection<Long> assignmentIds);

    List<MaterialAssignmentStudent> findAllByStudent_Id(Long studentId);

    List<MaterialAssignmentStudent> findAllByClassroom_Id(Long classId);

    List<MaterialAssignmentStudent> findAllById_AssignmentIdAndClassroom_Id(Long assignmentId, Long classId);

    List<MaterialAssignmentStudent> findAllById_StudentIdAndClassroom_Id(Long studentId, Long classId);

    Optional<MaterialAssignmentStudent> findById_AssignmentIdAndId_StudentId(Long assignmentId, Long studentId);

}
