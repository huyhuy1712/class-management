package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.entity.ExamSection;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExamSectionRepository
        extends JpaRepository<ExamSection, Long> {

    List<ExamSection> findAllByExam_IdOrderByOrderIndexAsc(Long examId);

    @EntityGraph(attributePaths = {
            "exam",
            "exam.teacher",
            "exam.subject"
    })
    Optional<ExamSection> findDetailById(Long id);
}