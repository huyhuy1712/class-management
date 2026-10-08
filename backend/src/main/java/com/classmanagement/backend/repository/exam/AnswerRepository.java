package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.entity.Answer;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AnswerRepository extends JpaRepository<Answer, Long> {

        List<Answer> findAllByQuestion_IdInOrderByQuestion_IdAscOrderIndexAsc(
                        Collection<Long> questionIds);

        List<Answer> findAllByQuestion_IdOrderByOrderIndexAsc(
                        Long questionId);

        @EntityGraph(attributePaths = {
                        "question"
        })
        Optional<Answer> findByIdAndQuestion_Id(
                        Long id,
                        Long questionId);

        @EntityGraph(attributePaths = {
                        "question"
        })
        List<Answer> findAllByIdIn(
                        Collection<Long> ids);

        void deleteAllByQuestion_Id(Long questionId);
}
