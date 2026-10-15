package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.entity.ExamAssignmentClass;
import com.classmanagement.backend.entity.compositeID.ExamAssignmentClassId;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ExamAssignmentClassRepository
                extends JpaRepository<ExamAssignmentClass, ExamAssignmentClassId> {
        interface ClassroomSummary {
                Long getAssignmentId(); Long getId(); String getName(); String getCode();
        }
        @org.springframework.data.jpa.repository.Query(value="""
                select a.id as "assignmentId", c.id as "id", c.name as "name", c.code as "code"
                from exam_assignments a join exams e on e.id=a.exam_id
                join classes c on c.teacher_id=e.teacher_id
                where a.id in (:ids) and (
                  (a.assignment_type='ALL' and c.status='ACTIVE')
                  or (a.assignment_type='CLASS' and exists (select 1 from exam_assignment_classes ac where ac.assignment_id=a.id and ac.class_id=c.id))
                  or (a.assignment_type='STUDENT' and exists (select 1 from exam_assignment_students s where s.assignment_id=a.id and s.class_id=c.id))
                ) order by a.id,c.id
                """,nativeQuery=true)
        List<ClassroomSummary> findClassroomSummaries(@org.springframework.data.repository.query.Param("ids") Collection<Long> ids);

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

        @org.springframework.data.jpa.repository.Modifying
        @org.springframework.data.jpa.repository.Query("delete from ExamAssignmentClass c where c.id.assignmentId = :assignmentId and c.id.classId in :ids")
        int deleteTargets(@org.springframework.data.repository.query.Param("assignmentId") Long assignmentId,
                        @org.springframework.data.repository.query.Param("ids") Collection<Long> ids);
}
