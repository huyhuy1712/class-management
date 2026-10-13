package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.entity.Exam;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface ExamRepository extends JpaRepository<Exam, Long> {
        @Lock(LockModeType.PESSIMISTIC_READ)
        Optional<Exam> findSharedLockedById(Long id);
        @Lock(LockModeType.PESSIMISTIC_READ)
        @org.springframework.data.jpa.repository.Query("select e from Exam e where e.id in :ids order by e.id")
        List<Exam> findSharedLockedBatch(@org.springframework.data.repository.query.Param("ids") java.util.Collection<Long> ids);

        boolean existsByTeacher_IdAndCode(Long teacherId, String code);

        @Lock(LockModeType.PESSIMISTIC_WRITE)
        Optional<Exam> findLockedByIdAndTeacher_Username(Long id, String username);

        List<Exam> findAllByTeacher_Username(String username);

        @EntityGraph(attributePaths = {
                        "teacher",
                        "subject"
        })
        Optional<Exam> findByIdAndTeacher_Username(
                        Long id,
                        String username);

        boolean existsByTeacher_UsernameAndCodeAndIdNot(
                        String username,
                        String code,
                        Long id);
}
