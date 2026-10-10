package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.entity.ExamAttempt;
import com.classmanagement.backend.entity.enums.ExamAttemptStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ExamAttemptRepository
                extends JpaRepository<ExamAttempt, Long> {

        @Query("select count(distinct a.assignment.exam.id) from ExamAttempt a where a.student.id = :studentId and a.status in :statuses")
        long countCompletedExams(@Param("studentId") Long studentId,
                @Param("statuses") Collection<ExamAttemptStatus> statuses);

        @EntityGraph(attributePaths = {
                        "assignment",
                        "assignment.exam",
                        "assignment.exam.subject"
        })
        Optional<ExamAttempt> findByAssignment_IdAndStudent_Id(
                        Long assignmentId,
                        Long studentId);

        @EntityGraph(attributePaths = {
                        "student"
        })
        List<ExamAttempt> findAllByAssignment_IdOrderByUpdatedAtDesc(
                        Long assignmentId);

        @EntityGraph(attributePaths = {
                        "student"
        })
        List<ExamAttempt> findAllByAssignment_IdAndStatus(
                        Long assignmentId,
                        ExamAttemptStatus status);

        @EntityGraph(attributePaths = {
                        "assignment",
                        "assignment.exam",
                        "assignment.exam.subject"
        })
        List<ExamAttempt> findAllByStudent_IdOrderByUpdatedAtDesc(
                        Long studentId);

        @EntityGraph(attributePaths = {
                        "assignment"
        })
        List<ExamAttempt> findAllByAssignment_IdInAndStatusIn(
                        Collection<Long> assignmentIds,
                        Collection<ExamAttemptStatus> statuses);

        boolean existsByAssignment_Exam_Id(Long examId);

        boolean existsByAssignment_Id(Long assignmentId);
}
