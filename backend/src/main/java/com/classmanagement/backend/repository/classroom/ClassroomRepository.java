package com.classmanagement.backend.repository.classroom;

import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.repository.projection.ClassroomSummaryProjection;

import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;

public interface ClassroomRepository extends JpaRepository<Classroom, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Classroom c join fetch c.teacher where c.id = :classroomId")
    Optional<Classroom> findByIdForUpdate(@Param("classroomId") Long classroomId);

    boolean existsByCode(String code);

    @Query("""
            select c.id as id,
                   c.name as name,
                   c.code as code,
                   s.id as subjectId,
                   s.name as subjectName,
                   t.id as teacherId,
                   t.fullName as teacherName,
                   c.academicYear as academicYear,
                   c.description as description,
                   c.status as status,
                   c.createdAt as createdAt,
                   c.updatedAt as updatedAt
            from Classroom c
            join c.subject s
            join c.teacher t
            """)
    List<ClassroomSummaryProjection> findAllSummaries();

    @EntityGraph(attributePaths = {"subject", "teacher"})
    List<Classroom> findAllByTeacher_Id(Long teacherId);

}
