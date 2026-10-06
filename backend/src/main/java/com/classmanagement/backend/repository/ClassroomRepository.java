package com.classmanagement.backend.repository;

import com.classmanagement.backend.entity.Classroom;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

public interface ClassroomRepository extends JpaRepository<Classroom, Long> {

    boolean existsByCode(String code);

    @EntityGraph(attributePaths = {"subject", "teacher"})
    List<Classroom> findAllByTeacher_Id(Long teacherId);

}