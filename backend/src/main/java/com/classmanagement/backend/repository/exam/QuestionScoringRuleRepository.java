package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.entity.QuestionScoringRule;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Collection;
import java.util.Optional;

public interface QuestionScoringRuleRepository
        extends JpaRepository<QuestionScoringRule, Long> {

    List<QuestionScoringRule> findAllByAnswer_IdOrderByCorrectCountAsc(Long answerId);

    List<QuestionScoringRule> findAllByAnswer_IdInOrderByAnswer_IdAscCorrectCountAsc(
            Collection<Long> answerIds);

    Optional<QuestionScoringRule> findByAnswer_IdAndCorrectCount(
            Long answerId,
            Integer correctCount);

    @EntityGraph(attributePaths = {
            "answer",
            "answer.question",
            "answer.question.section",
            "answer.question.section.exam",
            "answer.question.section.exam.teacher"
    })
    Optional<QuestionScoringRule> findDetailById(Long id);
}
