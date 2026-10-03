package com.classmanagement.backend.repository;

import com.classmanagement.backend.entity.ClassStudent;
import com.classmanagement.backend.entity.Classroom;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ClassroomRepository extends JpaRepository<Classroom, Long> {

    boolean existsByCode(String code);

    List<Classroom> findAllByTeacher_Id(Long teacherId);

}