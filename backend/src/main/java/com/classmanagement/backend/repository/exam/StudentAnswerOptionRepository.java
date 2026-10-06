package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.entity.StudentAnswerOption;
import com.classmanagement.backend.entity.compositeID.StudentAnswerOptionId;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface StudentAnswerOptionRepository
        extends JpaRepository<StudentAnswerOption, StudentAnswerOptionId> {

    @EntityGraph(attributePaths = {
            "option"
    })
    List<StudentAnswerOption> findAllByAnswerValue_Id(Long answerValueId);

    @EntityGraph(attributePaths = {
            "answerValue",
            "option"
    })
    List<StudentAnswerOption> findAllByAnswerValue_IdIn(Collection<Long> answerValueIds);

    void deleteAllByAnswerValue_Id(Long answerValueId);

    void deleteAllByAnswerValue_IdIn(Collection<Long> answerValueIds);
}