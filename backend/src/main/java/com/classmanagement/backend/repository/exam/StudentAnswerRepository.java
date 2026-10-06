package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.entity.StudentAnswer;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentAnswerRepository
        extends JpaRepository<StudentAnswer, Long> {

    @EntityGraph(attributePaths = {
            "question"
    })
    List<StudentAnswer> findAllByAttempt_Id(Long attemptId);

}