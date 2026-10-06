package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.entity.QuestionScoringRule;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuestionScoringRuleRepository
        extends JpaRepository<QuestionScoringRule, Long> {

    List<QuestionScoringRule> findAllByQuestion_IdOrderByCorrectCountAsc(Long questionId);

    Optional<QuestionScoringRule> findByQuestion_IdAndCorrectCount(
            Long questionId,
            Integer correctCount);

    @EntityGraph(attributePaths = {
            "question",
            "question.section",
            "question.section.exam",
            "question.section.exam.teacher"
    })
    Optional<QuestionScoringRule> findDetailById(Long id);
}