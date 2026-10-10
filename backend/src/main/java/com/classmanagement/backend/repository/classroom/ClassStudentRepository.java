package com.classmanagement.backend.repository.classroom;

import java.util.List;
import java.util.Collection;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.classmanagement.backend.repository.projection.ClassroomSummaryProjection;
import com.classmanagement.backend.entity.ClassStudent;
import com.classmanagement.backend.entity.compositeID.ClassStudentId;

public interface ClassStudentRepository
        extends JpaRepository<ClassStudent, ClassStudentId> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select cs from ClassStudent cs
            join fetch cs.student
            join fetch cs.classroom c
            join fetch c.teacher
            where c.id = :classroomId and cs.student.id = :studentId
            """)
    Optional<ClassStudent> findMembershipForUpdate(@Param("classroomId") Long classroomId,
                                                  @Param("studentId") Long studentId);

    @Query("""
            select c.id as id, c.name as name, c.code as code,
                   s.id as subjectId, s.name as subjectName,
                   t.id as teacherId, t.fullName as teacherName,
                   c.academicYear as academicYear, c.description as description,
                   c.status as status, c.createdAt as createdAt, c.updatedAt as updatedAt
            from ClassStudent cs
            join cs.classroom c
            left join c.subject s
            left join c.teacher t
            where cs.student.id = :studentId
            order by cs.joinedAt desc, c.id desc
            """)
    List<ClassroomSummaryProjection> findClassSummariesByStudentId(
            @Param("studentId") Long studentId);

    @Query("""
            select distinct cs.student.id from ClassStudent cs
            where cs.classroom.teacher.id = :teacherId
              and cs.classroom.status = com.classmanagement.backend.entity.enums.ClassroomStatus.ACTIVE
              and cs.student.id in :studentIds
            """)
    List<Long> findAssignableStudentIds(@Param("teacherId") Long teacherId,
                                      @Param("studentIds") Collection<Long> studentIds);

    boolean existsByClassroomIdAndStudentId(Long classroomId, Long studentId);

    List<ClassStudent> findAllByClassroomId(Long classroomId);

    void deleteAllByClassroomId(Long classroomId);

    @EntityGraph(attributePaths = {"classroom"})
    List<ClassStudent> findAllByStudent_Id(Long studentId);

    @EntityGraph(attributePaths = {"student", "classroom"})
    List<ClassStudent> findAllByClassroom_Teacher_Id(Long teacherId);
}
