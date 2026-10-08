package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.entity.StudentAnswerValue;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Collection;
import java.util.Optional;

public interface StudentAnswerValueRepository
        extends JpaRepository<StudentAnswerValue, Long> {

    List<StudentAnswerValue> findAllByStudentAnswer_IdInOrderByStudentAnswer_IdAscIdAsc(
            Collection<Long> studentAnswerIds);

    @EntityGraph(attributePaths = {
            "answer"
    })
    List<StudentAnswerValue> findAllByStudentAnswer_IdOrderByAnswer_OrderIndexAsc(
            Long studentAnswerId);

    Optional<StudentAnswerValue> findByStudentAnswer_IdAndAnswer_Id(
            Long studentAnswerId,
            Long answerId);

    void deleteAllByStudentAnswer_Id(Long studentAnswerId);
}
