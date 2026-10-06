package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.entity.ExamAssignmentStudent;
import com.classmanagement.backend.entity.compositeID.ExamAssignmentStudentId;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExamAssignmentStudentRepository
        extends JpaRepository<ExamAssignmentStudent, ExamAssignmentStudentId> {

    @EntityGraph(attributePaths = {
            "student"
    })
    List<ExamAssignmentStudent> findAllByAssignment_Id(Long assignmentId);

    boolean existsByAssignment_IdAndStudent_Id(
            Long assignmentId,
            Long studentId);

    void deleteAllByAssignment_Id(Long assignmentId);
}