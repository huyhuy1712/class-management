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
        @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
        Optional<ExamAttempt> findLockedById(Long id);
        @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
        @Query("select t from ExamAttempt t where t.id in :ids order by t.id")
        List<ExamAttempt> findLockedBatch(@Param("ids") Collection<Long> ids);
        @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
        Optional<ExamAttempt> findLockedByAssignment_IdAndStudent_Id(Long assignmentId, Long studentId);
        @org.springframework.data.jpa.repository.Modifying
        @Query(value="insert into exam_attempts(assignment_id,student_id) values (:assignmentId,:studentId) on conflict (assignment_id,student_id) do nothing",nativeQuery=true)
        int insertIfAbsent(@Param("assignmentId") Long assignmentId,@Param("studentId") Long studentId);

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
