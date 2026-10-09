package com.classmanagement.backend.repository.classroom;

import java.util.List;
import java.util.Collection;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.classmanagement.backend.entity.ClassStudent;
import com.classmanagement.backend.entity.compositeID.ClassStudentId;

public interface ClassStudentRepository
        extends JpaRepository<ClassStudent, ClassStudentId> {

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
