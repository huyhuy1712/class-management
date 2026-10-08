package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.entity.Exam;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface ExamRepository extends JpaRepository<Exam, Long> {

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
