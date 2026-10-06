package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.entity.AttemptSectionScore;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AttemptSectionScoreRepository
        extends JpaRepository<AttemptSectionScore, Long> {

    @EntityGraph(attributePaths = {
            "section"
    })
    List<AttemptSectionScore> findAllByAttempt_IdOrderBySection_OrderIndexAsc(Long attemptId);

    Optional<AttemptSectionScore> findByAttempt_IdAndSection_Id(
            Long attemptId,
            Long sectionId);

    void deleteAllByAttempt_Id(Long attemptId);
}