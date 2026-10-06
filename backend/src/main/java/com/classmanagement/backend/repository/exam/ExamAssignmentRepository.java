package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.entity.ExamAssignment;
import com.classmanagement.backend.entity.enums.ExamAssignmentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExamAssignmentRepository
        extends JpaRepository<ExamAssignment, Long> {

    @EntityGraph(attributePaths = {
            "exam",
            "exam.subject"
    })
    List<ExamAssignment> findAllByExam_Teacher_UsernameOrderByCreatedAtDesc(
            String username);

    @EntityGraph(attributePaths = {
            "exam",
            "exam.teacher",
            "exam.subject"
    })
    Optional<ExamAssignment> findDetailById(Long id);

    @EntityGraph(attributePaths = {
            "exam",
            "exam.subject"
    })
    List<ExamAssignment> findAllByExam_Teacher_UsernameAndStatusOrderByCreatedAtDesc(
            String username,
            ExamAssignmentStatus status);
}