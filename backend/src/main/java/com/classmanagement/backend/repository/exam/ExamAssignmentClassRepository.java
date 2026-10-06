package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.entity.ExamAssignmentClass;
import com.classmanagement.backend.entity.compositeID.ExamAssignmentClassId;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ExamAssignmentClassRepository
                extends JpaRepository<ExamAssignmentClass, ExamAssignmentClassId> {

        @EntityGraph(attributePaths = {
                        "classroom"
        })
        List<ExamAssignmentClass> findAllByAssignment_Id(
                        Long assignmentId);

        List<ExamAssignmentClass> findAllByAssignment_IdIn(
                        Collection<Long> assignmentIds);

        boolean existsByAssignment_IdAndClassroom_Id(
                        Long assignmentId,
                        Long classroomId);

        void deleteAllByAssignment_Id(
                        Long assignmentId);
}