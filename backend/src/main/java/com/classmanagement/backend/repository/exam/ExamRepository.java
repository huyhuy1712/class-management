package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.entity.Exam;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExamRepository extends JpaRepository<Exam, Long> {

        List<Exam> findAllByTeacher_Username(String username);

        @EntityGraph(attributePaths = {
                        "teacher",
                        "subject"
        })
        Optional<Exam> findByIdAndTeacher_Username(
                        Long id,
                        String username);
}