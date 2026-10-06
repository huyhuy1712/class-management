package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.entity.ExamAssignment;
import com.classmanagement.backend.entity.enums.ExamAssignmentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ExamAssignmentRepository
                extends JpaRepository<ExamAssignment, Long> {

        @EntityGraph(attributePaths = {
                        "exam"
        })
        List<ExamAssignment> findAllByExam_Id(
                        Long examId);

        @EntityGraph(attributePaths = {
                        "exam"
        })
        List<ExamAssignment> findAllByExam_IdIn(
                        Collection<Long> examIds);

        @EntityGraph(attributePaths = {
                        "exam"
        })
        Optional<ExamAssignment> findByIdAndExam_Teacher_Username(
                        Long id,
                        String username);

        List<ExamAssignment> findAllByExam_IdAndStatus(
                        Long examId,
                        ExamAssignmentStatus status);

        boolean existsByExam_Id(Long examId);
}