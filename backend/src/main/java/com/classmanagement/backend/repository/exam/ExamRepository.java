package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.entity.Exam;
import com.classmanagement.backend.entity.enums.ExamStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExamRepository extends JpaRepository<Exam, Long> {

    @EntityGraph(attributePaths = {
            "teacher",
            "subject"
    })
    Optional<Exam> findDetailById(Long id);

    @EntityGraph(attributePaths = {
            "subject"
    })
    List<Exam> findAllByTeacher_UsernameOrderByCreatedAtDesc(
            String username);

    @EntityGraph(attributePaths = {
            "subject"
    })
    List<Exam> findAllByTeacher_UsernameAndStatusOrderByCreatedAtDesc(
            String username,
            ExamStatus status);
}