package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.entity.ExamAssignmentClass;
import com.classmanagement.backend.entity.compositeID.ExamAssignmentClassId;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ExamAssignmentClassRepository
                extends JpaRepository<ExamAssignmentClass, ExamAssignmentClassId> {
        @org.springframework.data.jpa.repository.Modifying
        @org.springframework.data.jpa.repository.Query(value = """
                        with class_students_in_scope as materialized (
                            select cs.student_id
                            from class_students cs
                            where cs.class_id = :classroomId
                              and (:studentId is null or cs.student_id = :studentId)
                        ),
                        affected_assignments as materialized (
                            select a.id
                            from exam_assignments a
                            join exams e on e.id = a.exam_id
                            where (
                                a.assignment_type = 'CLASS'
                                and exists (
                                    select 1
                                    from exam_assignment_classes ac
                                    where ac.assignment_id = a.id
                                      and ac.class_id = :classroomId
                                )
                            ) or (
                                a.assignment_type = 'ALL'
                                and exists (
                                    select 1
                                    from classes c
                                    where c.id = :classroomId
                                      and c.teacher_id = e.teacher_id
                                )
                            ) or (
                                a.assignment_type = 'STUDENT'
                                and exists (
                                    select 1
                                    from exam_assignment_students target
                                    where target.assignment_id = a.id
                                      and target.class_id = :classroomId
                                      and (:studentId is null or target.student_id = :studentId)
                                )
                            )
                        ),
                        deleted_attempts as (
                            delete from exam_attempts attempt
                            using affected_assignments affected, class_students_in_scope student
                            where attempt.assignment_id = affected.id
                              and attempt.student_id = student.student_id
                            returning attempt.id
                        ),
                        deleted_completion_rows as (
                            delete from exam_assignment_completion_students cohort
                            using affected_assignments affected, class_students_in_scope student
                            where cohort.assignment_id = affected.id
                              and cohort.student_id = student.student_id
                            returning cohort.assignment_id
                        )
                        delete from exam_assignment_students target
                        using affected_assignments affected
                        where target.assignment_id = affected.id
                          and target.class_id = :classroomId
                          and (:studentId is null or target.student_id = :studentId)
                        """, nativeQuery = true)
        int deleteStudentExamDataForClass(
                        @org.springframework.data.repository.query.Param("classroomId") Long classroomId,
                        @org.springframework.data.repository.query.Param("studentId") Long studentId);

        @org.springframework.data.jpa.repository.Modifying
        @org.springframework.data.jpa.repository.Query(value = """
                        with affected_exams as materialized (
                            select distinct a.exam_id
                            from exam_assignments a
                            join exams e on e.id = a.exam_id
                            where (
                                a.assignment_type = 'CLASS'
                                and exists (
                                    select 1
                                    from exam_assignment_classes ac
                                    where ac.assignment_id = a.id
                                      and ac.class_id = :classroomId
                                )
                            ) or (
                                a.assignment_type = 'STUDENT'
                                and exists (
                                    select 1
                                    from exam_assignment_students students
                                    where students.assignment_id = a.id
                                      and (
                                          students.class_id = :classroomId
                                          or (
                                              students.class_id is null
                                              and exists (
                                                  select 1
                                                  from class_students cs
                                                  where cs.class_id = :classroomId
                                                    and cs.student_id = students.student_id
                                              )
                                          )
                                      )
                                )
                            ) or (
                                a.assignment_type = 'ALL'
                                and exists (
                                    select 1
                                    from classes c
                                    where c.id = :classroomId
                                      and c.teacher_id = e.teacher_id
                                )
                            )
                        ),
                        affected_assignments as materialized (
                            select a.id, a.exam_id
                            from exam_assignments a
                            join affected_exams affected on affected.exam_id = a.exam_id
                        ),
                        deleted_assignments as (
                            delete from exam_assignments a
                            using affected_assignments affected
                            where a.id = affected.id
                            returning a.id
                        )
                        update exams e
                        set status = 'DRAFT',
                            updated_at = current_timestamp,
                            revision = revision + 1
                        from affected_exams affected
                        where e.id = affected.exam_id
                        """, nativeQuery = true)
        int deleteAssignmentsAndResetExamsForDeletedClass(
                        @org.springframework.data.repository.query.Param("classroomId") Long classroomId);

        interface ClassroomSummary {
                Long getAssignmentId(); Long getId(); String getName(); String getCode();
        }
        interface AssignmentTargetName {
                Long getAssignmentId();
                String getName();
        }

        @org.springframework.data.jpa.repository.Query(value = """
                        select ac.assignment_id as "assignmentId", c.name as "name"
                        from exam_assignment_classes ac
                        join classes c on c.id = ac.class_id
                        where ac.assignment_id in (:ids)
                        union all
                        select s.assignment_id as "assignmentId", u.full_name as "name"
                        from exam_assignment_students s
                        join users u on u.id = s.student_id
                        where s.assignment_id in (:ids)
                        order by "assignmentId", "name"
                        """, nativeQuery = true)
        List<AssignmentTargetName> findTargetNames(
                        @org.springframework.data.repository.query.Param("ids") Collection<Long> assignmentIds);

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
