package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.dto.exam.CreateCompleteExamRequest;
import com.classmanagement.backend.dto.exam.CreateCompleteExamRequest.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.exception.ExamValidationException;
import jakarta.validation.Validation;
import org.hibernate.validator.messageinterpolation.ParameterMessageInterpolator;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class ExamStructureValidatorTest {
    private static final jakarta.validation.ValidatorFactory FACTORY = Validation.byDefaultProvider()
            .configure().messageInterpolator(new ParameterMessageInterpolator()).buildValidatorFactory();
    private final ExamStructureValidator validator = new ExamStructureValidator(FACTORY.getValidator());

    @Test void acceptsMixedGroupsAndCalculatesTotal() {
        var summary = validator.validate(request(List.of(choice(), trueFalse()), "3", assignment()));
        assertEquals(new BigDecimal("3.00"), summary.totalScore());
    }
    @Test void acceptsAllFalseTrueFalseGroup() {
        assertDoesNotThrow(() -> validator.validate(request(List.of(trueFalse()), "2", assignment())));
    }
    @Test void rejectsQuestionPointMismatch() {
        var error = assertThrows(ExamValidationException.class,
                () -> validator.validate(request(List.of(choice()), "2", assignment())));
        assertTrue(error.getValidationErrors().containsKey("sections[0].questions[0].points"));
    }
    @Test void rejectsSingleChoiceWithTwoCorrectOptions() {
        var answer = new Answer(AnswerType.SINGLE_CHOICE, null, null, null, number("1"), ScoringType.PER_ANSWER,
                null, false, List.of(option(true, null), option(true, null)), null);
        assertThrows(ExamValidationException.class, () -> validator.validate(request(List.of(answer), "1", assignment())));
    }
    @Test void rejectsMissingCorrectCountRule() {
        var answer = new Answer(AnswerType.TRUE_FALSE, null, null, null, number("2"), ScoringType.CORRECT_COUNT,
                null, false, List.of(option(false, null), option(false, null)),
                List.of(new ScoringRule(0, number("0")), new ScoringRule(2, number("2"))));
        assertThrows(ExamValidationException.class, () -> validator.validate(request(List.of(answer), "2", assignment())));
    }
    @Test void acceptsCorrectCountGroup() {
        var answer = new Answer(AnswerType.TRUE_FALSE, null, null, null, number("2"), ScoringType.CORRECT_COUNT,
                null, false, List.of(option(false, null), option(true, null)),
                List.of(new ScoringRule(0, number("0")), new ScoringRule(1, number("0.5")), new ScoringRule(2, number("2"))));
        assertEquals(number("2.00"), validator.validate(request(List.of(answer), "2", assignment())).totalScore());
    }
    @Test void rejectsCorrectCountOnEssay() {
        var answer = new Answer(AnswerType.ESSAY, null, null, null, number("1"), ScoringType.CORRECT_COUNT,
                null, false, null, null);
        assertThrows(ExamValidationException.class, () -> validator.validate(request(List.of(answer), "1", assignment())));
    }
    @Test void rejectsMissingShortAnswerKey() {
        var answer = new Answer(AnswerType.SHORT_ANSWER, null, null, null, number("1"), ScoringType.PER_ANSWER,
                "  ", false, null, null);
        assertThrows(ExamValidationException.class, () -> validator.validate(request(List.of(answer), "1", assignment())));
    }
    @Test void rejectsDuplicateTargets() {
        var target = new Assignment(ExamAssignmentType.CLASS, List.of(1L,1L), null, ScoreVisibility.NEVER,
                AnswerVisibility.NEVER, null, false, null, null);
        assertThrows(ExamValidationException.class, () -> validator.validate(request(List.of(choice()), "1", target)));
    }
    @Test void rejectsThresholdAboveTotalScore() {
        var target = new Assignment(ExamAssignmentType.ALL, null, null, ScoreVisibility.NEVER,
                AnswerVisibility.AFTER_SCORE, number("2"), false, null, null);
        assertThrows(ExamValidationException.class, () -> validator.validate(request(List.of(choice()), "1", target)));
    }
    @Test void rejectsNullNestedOption() {
        var answer = new Answer(AnswerType.SINGLE_CHOICE, null, null, null, number("1"), ScoringType.PER_ANSWER,
                null, false, Arrays.asList(option(true, null), null), null);
        assertThrows(ExamValidationException.class, () -> validator.validate(request(List.of(answer), "1", assignment())));
    }
    @Test void rejectsOverPrecisionScore() {
        var answer = new Answer(AnswerType.ESSAY, null, null, null, number("1.001"), ScoringType.PER_ANSWER,
                null, false, null, null);
        assertThrows(ExamValidationException.class, () -> validator.validate(request(List.of(answer), "1.001", assignment())));
    }
    @Test void rejectsMediaUsedAsBothImageAndAudio() {
        UUID id = UUID.randomUUID();
        var answer = new Answer(AnswerType.ESSAY, null, id, id, number("1"), ScoringType.PER_ANSWER,
                null, false, null, null);
        assertThrows(ExamValidationException.class, () -> validator.validate(request(List.of(answer), "1", assignment())));
    }
    @Test void rejectsMediaWithoutDraftToken() {
        var answer = new Answer(AnswerType.ESSAY, null, UUID.randomUUID(), null, number("1"), ScoringType.PER_ANSWER,
                null, false, null, null);
        assertThrows(ExamValidationException.class, () -> validator.validate(request(List.of(answer), "1", assignment())));
    }

    static CreateCompleteExamRequest request(List<Answer> answers, String points, Assignment assignment) {
        return new CreateCompleteExamRequest(new BasicInfo("Đề thử", 1L, "10", null, null, 60, 0),
                assignment, null, List.of(new Section("Phần 1", null, null, null,
                List.of(new Question("Câu hỏi", null, null, number(points), answers)))));
    }
    static Assignment assignment() {
        return new Assignment(ExamAssignmentType.ALL, null, null, ScoreVisibility.AFTER_SUBMIT,
                AnswerVisibility.AFTER_SUBMIT, null, false, null, null);
    }
    static Answer choice() {
        return new Answer(AnswerType.SINGLE_CHOICE, null, null, null, number("1"), ScoringType.PER_ANSWER,
                null, false, List.of(option(true, null), option(false, null)), null);
    }
    static Answer trueFalse() {
        return new Answer(AnswerType.TRUE_FALSE, null, null, null, number("2"), ScoringType.PER_ANSWER,
                null, false, List.of(option(false, number("1")), option(false, number("1"))), null);
    }
    static Option option(boolean correct, BigDecimal points) {
        return new Option("Nội dung ý/phương án", null, null, correct, points);
    }
    static BigDecimal number(String value) { return new BigDecimal(value); }
}
