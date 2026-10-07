package com.classmanagement.backend.repository.classroom;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.classmanagement.backend.entity.ClassStudent;
import com.classmanagement.backend.entity.compositeID.ClassStudentId;

public interface ClassStudentRepository
        extends JpaRepository<ClassStudent, ClassStudentId> {

    boolean existsByClassroomIdAndStudentId(Long classroomId, Long studentId);

    List<ClassStudent> findAllByClassroomId(Long classroomId);

    void deleteAllByClassroomId(Long classroomId);

    @EntityGraph(attributePaths = {"student", "classroom"})
    List<ClassStudent> findAllByClassroom_Teacher_Id(Long teacherId);
}
