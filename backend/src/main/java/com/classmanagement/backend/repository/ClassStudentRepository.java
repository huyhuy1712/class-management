package com.classmanagement.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import com.classmanagement.backend.entity.ClassStudent;
import com.classmanagement.backend.entity.ClassStudentId;

public interface ClassStudentRepository
        extends JpaRepository<ClassStudent, ClassStudentId> {

    boolean existsByClassroomIdAndStudentId( Long classroomId, Long studentId);
    
    List<ClassStudent> findAllByClassroomId(Long classroomId);

    List<ClassStudent> findAllByClassroom_Teacher_Id(Long teacherId);

    @EntityGraph(attributePaths = "classroom")
    List<ClassStudent> findAllByStudent_Id(Long studentId);

    
}