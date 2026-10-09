package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.dto.exam.UpdateExamContentRequest;
import com.classmanagement.backend.dto.exam.UpdateExamContentRequest.Node;
import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.repository.exam.*;
import java.util.*;
import static com.classmanagement.backend.service.exam.ExamStructureValidator.list;

/** Loads each tree layer once and validates every supplied identity before writes. */
final class ExamContentPlan {
    final ExamContentLayer<UpdateExamContentRequest.Section, ExamSection> sections;
    final ExamContentLayer<UpdateExamContentRequest.Question, Question> questions;
    final ExamContentLayer<UpdateExamContentRequest.Answer, Answer> answers;
    final ExamContentLayer<UpdateExamContentRequest.Option, AnswerOption> options;
    final ExamContentLayer<UpdateExamContentRequest.Rule, QuestionScoringRule> rules;

    ExamContentPlan(Long examId, UpdateExamContentRequest request,
            ExamSectionRepository sectionRepo, QuestionRepository questionRepo, AnswerRepository answerRepo,
            AnswerOptionRepository optionRepo, QuestionScoringRuleRepository ruleRepo) {
        var oldSections = sectionRepo.findAllByExam_IdOrderByOrderIndexAsc(examId);
        var sectionIds = oldSections.stream().map(ExamSection::getId).toList();
        List<Question> oldQuestions = sectionIds.isEmpty() ? List.of()
                : questionRepo.findAllBySection_IdInOrderBySection_IdAscOrderIndexAsc(sectionIds);
        var questionIds = oldQuestions.stream().map(Question::getId).toList();
        List<Answer> oldAnswers = questionIds.isEmpty() ? List.of()
                : answerRepo.findAllByQuestion_IdInOrderByQuestion_IdAscOrderIndexAsc(questionIds);
        var answerIds = oldAnswers.stream().map(Answer::getId).toList();
        List<AnswerOption> oldOptions = answerIds.isEmpty() ? List.of()
                : optionRepo.findAllByAnswer_IdInOrderByAnswer_IdAscOrderIndexAsc(answerIds);
        List<QuestionScoringRule> oldRules = answerIds.isEmpty() ? List.of()
                : ruleRepo.findAllByAnswer_IdInOrderByAnswer_IdAscCorrectCountAsc(answerIds);
        var sectionEntries = ordered(request.sections(), null);
        var questionEntries = sectionEntries.stream().flatMap(s -> ordered(s.input().questions(), s.input()).stream()).toList();
        var answerEntries = questionEntries.stream().flatMap(q -> ordered(q.input().answers(), q.input()).stream()).toList();
        var optionEntries = answerEntries.stream().flatMap(a -> ordered(list(a.input().options()), a.input()).stream()).toList();
        var ruleEntries = answerEntries.stream().flatMap(a -> list(a.input().scoringRules()).stream()
                .map(r -> new ExamContentLayer.Entry<>(r, a.input(), r.correctCount()))).toList();
        sections = new ExamContentLayer<>("sections", sectionEntries, oldSections, ExamSection::getId,
                s -> s.getExam().getId(), ExamSection::getOrderIndex, ExamSection::setOrderIndex);
        questions = new ExamContentLayer<>("sections.questions", questionEntries, oldQuestions, Question::getId,
                q -> q.getSection().getId(), Question::getOrderIndex, Question::setOrderIndex);
        answers = new ExamContentLayer<>("sections.questions.answers", answerEntries, oldAnswers, Answer::getId,
                a -> a.getQuestion().getId(), Answer::getOrderIndex, Answer::setOrderIndex);
        options = new ExamContentLayer<>("sections.questions.answers.options", optionEntries, oldOptions, AnswerOption::getId,
                o -> o.getAnswer().getId(), AnswerOption::getOrderIndex, AnswerOption::setOrderIndex);
        rules = new ExamContentLayer<>("sections.questions.answers.scoringRules", ruleEntries, oldRules, QuestionScoringRule::getId,
                r -> r.getAnswer().getId(), QuestionScoringRule::getCorrectCount, QuestionScoringRule::setCorrectCount);
    }

    private static <S extends Node> List<ExamContentLayer.Entry<S>> ordered(List<S> inputs, Node parent) {
        List<ExamContentLayer.Entry<S>> result = new ArrayList<>();
        for (int i = 0; i < inputs.size(); i++) result.add(new ExamContentLayer.Entry<>(inputs.get(i), parent, i + 1));
        return result;
    }
}
