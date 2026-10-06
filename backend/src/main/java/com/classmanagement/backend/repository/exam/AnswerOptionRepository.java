package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.entity.AnswerOption;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AnswerOptionRepository
                extends JpaRepository<AnswerOption, Long> {

        List<AnswerOption> findAllByAnswer_IdOrderByOrderIndexAsc(
                        Long answerId);

        @EntityGraph(attributePaths = {
                        "answer"
        })
        Optional<AnswerOption> findByIdAndAnswer_Id(
                        Long id,
                        Long answerId);

        @EntityGraph(attributePaths = {
                        "answer"
        })
        List<AnswerOption> findAllByIdIn(
                        Collection<Long> ids);

        void deleteAllByAnswer_Id(Long answerId);
}