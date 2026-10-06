package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.entity.ExamAttemptEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExamAttemptEventRepository
        extends JpaRepository<ExamAttemptEvent, Long> {

    List<ExamAttemptEvent> findAllByAttempt_IdOrderByEventTimeAsc(Long attemptId);

    void deleteAllByAttempt_Id(Long attemptId);
}