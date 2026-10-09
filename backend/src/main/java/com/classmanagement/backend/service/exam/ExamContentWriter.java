package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.dto.exam.UpdateExamContentResponse.IdMappings;
import com.classmanagement.backend.dto.exam.UpdateExamContentRequest.Node;
import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.repository.exam.*;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.*;

@Component
@RequiredArgsConstructor
public class ExamContentWriter {
    private final EntityManager entityManager;
    private final ExamSectionRepository sectionRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final AnswerOptionRepository optionRepository;
    private final QuestionScoringRuleRepository ruleRepository;

    IdMappings write(Exam exam, ExamContentPlan plan, Map<UUID, ExamMedia> media) {
        // Bulk deletes run bottom-up; managed survivors retain their original IDs.
        deleteRemoved(plan.rules, ruleRepository);
        deleteRemoved(plan.options, optionRepository);
        deleteRemoved(plan.answers, answerRepository);
        deleteRemoved(plan.questions, questionRepository);
        deleteRemoved(plan.sections, sectionRepository);
        // All moves must reach the DB before IDENTITY inserts use final positions.
        boolean moved = plan.sections.parkChangedOrder() | plan.questions.parkChangedOrder()
                | plan.answers.parkChangedOrder() | plan.options.parkChangedOrder() | plan.rules.parkChangedOrder();
        if (moved) entityManager.flush();
        Map<Node, ExamSection> sections = new IdentityHashMap<>();
        for (var entry : plan.sections.entries) {
            var source = entry.input();
            var section = plan.sections.upsert(entry, ExamSection::new, e -> {
                e.setExam(exam); e.setTitle(source.title().trim()); e.setParagraph(trim(source.paragraph()));
                e.setPoints(source.questions().stream().map(q -> q.points()).reduce(BigDecimal.ZERO, BigDecimal::add));
                e.setImageUrl(path(media, source.imageMediaId())); e.setAudioUrl(path(media, source.audioMediaId()));
            }, entityManager::persist);
            sections.put(source, section);
        }
        Map<Node, Question> questions = new IdentityHashMap<>();
        for (var entry : plan.questions.entries) {
            var source = entry.input();
            var question = plan.questions.upsert(entry, Question::new, e -> {
                e.setSection(sections.get(entry.parent())); e.setContent(source.content().trim()); e.setPoints(source.points());
                e.setImageUrl(path(media, source.imageMediaId())); e.setAudioUrl(path(media, source.audioMediaId()));
            }, entityManager::persist);
            questions.put(source, question);
        }
        Map<Node, Answer> answers = new IdentityHashMap<>();
        for (var entry : plan.answers.entries) {
            var source = entry.input();
            var answer = plan.answers.upsert(entry, Answer::new, e -> {
                e.setQuestion(questions.get(entry.parent())); e.setAnswerType(source.answerType());
                e.setContent(trim(source.content())); e.setPoints(source.points()); e.setScoringType(source.scoringType());
                e.setCorrectAnswerText(trim(source.correctAnswerText())); e.setCaseSensitive(Boolean.TRUE.equals(source.caseSensitive()));
                e.setImageUrl(path(media, source.imageMediaId())); e.setAudioUrl(path(media, source.audioMediaId()));
            }, entityManager::persist);
            answers.put(source, answer);
        }
        for (var entry : plan.options.entries) {
            var source = entry.input();
            plan.options.upsert(entry, AnswerOption::new, e -> {
                e.setAnswer(answers.get(entry.parent())); e.setContent(trim(source.content())); e.setCorrect(source.isCorrect());
                e.setPoints(source.points() == null ? BigDecimal.ZERO : source.points());
                e.setImageUrl(path(media, source.imageMediaId())); e.setAudioUrl(path(media, source.audioMediaId()));
            }, entityManager::persist);
        }
        for (var entry : plan.rules.entries) {
            var source = entry.input();
            plan.rules.upsert(entry, QuestionScoringRule::new, e -> {
                e.setAnswer(answers.get(entry.parent())); e.setScore(source.score());
            }, entityManager::persist);
        }
        return new IdMappings(List.copyOf(plan.sections.mappings), List.copyOf(plan.questions.mappings),
                List.copyOf(plan.answers.mappings), List.copyOf(plan.options.mappings), List.copyOf(plan.rules.mappings));
    }

    private static <S extends Node, E> void deleteRemoved(ExamContentLayer<S, E> layer,
            org.springframework.data.jpa.repository.JpaRepository<E, Long> repository) {
        var removed = layer.removed();
        if (!removed.isEmpty()) repository.deleteAllByIdInBatch(removed);
    }
    private static String path(Map<UUID, ExamMedia> media, UUID id) {
        return id == null ? null : media.get(id).getObjectPath();
    }
    private static String trim(String text) { return text == null || text.isBlank() ? null : text.trim(); }
}
