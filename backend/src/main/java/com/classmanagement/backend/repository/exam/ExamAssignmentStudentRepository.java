package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.entity.ExamAssignmentStudent;
import com.classmanagement.backend.entity.compositeID.ExamAssignmentStudentId;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Collection;

public interface ExamAssignmentStudentRepository
        extends JpaRepository<ExamAssignmentStudent, ExamAssignmentStudentId> {

    @EntityGraph(attributePaths = {
            "student"
    })
    List<ExamAssignmentStudent> findAllByAssignment_Id(Long assignmentId);

    List<ExamAssignmentStudent> findAllByAssignment_IdIn(Collection<Long> assignmentIds);

    boolean existsByAssignment_IdAndStudent_Id(
            Long assignmentId,
            Long studentId);

    void deleteAllByAssignment_Id(Long assignmentId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("delete from ExamAssignmentStudent s where s.id.assignmentId = :assignmentId and s.id.studentId in :ids")
    int deleteTargets(@org.springframework.data.repository.query.Param("assignmentId") Long assignmentId,
            @org.springframework.data.repository.query.Param("ids") Collection<Long> ids);
}
