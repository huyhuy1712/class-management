package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.entity.Question;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuestionRepository
        extends JpaRepository<Question, Long> {

    List<Question> findAllBySection_IdOrderByOrderIndexAsc(Long sectionId);

    @EntityGraph(attributePaths = {
            "section",
            "section.exam",
            "section.exam.teacher"
    })
    Optional<Question> findDetailById(Long id);
}