package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.dto.exam.ExamConfigurationResponse;
import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.exception.ConflictException;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.repository.exam.*;
import com.classmanagement.backend.service.StorageService;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class ExamDetailServiceTest {
    private final List<String> calls = new ArrayList<>();
    private List<ExamSection> sections = List.of();
    private List<Question> questions = List.of();
    private List<Answer> answers = List.of();
    private List<AnswerOption> options = List.of();
    private List<QuestionScoringRule> rules = List.of();
    private List<ExamMedia> media = List.of();
    private boolean wrongOwner;
    private final UUID mediaId = UUID.randomUUID();

    @Test void ownershipFailureStopsAllContentReads() {
        wrongOwner = true;
        assertThrows(ResourceNotFoundException.class, () -> service().get(7L, "other"));
        assertEquals(List.of("configuration"), calls);
    }

    @Test void emptyExamSkipsAllChildAndStorageReads() {
        var response = service().get(7L, "teacher");
        assertEquals(7L, response.id());
        assertTrue(response.sections().isEmpty());
        assertEquals(List.of("configuration", "findAllByExam_IdOrderByOrderIndexAsc"), calls);
    }

    @Test void mapsOrderedTreeRulesCorrectAnswersAndAllMediaPositions() {
        tree();
        var response = service().get(7L, "teacher");
        var section = response.sections().getFirst();
        assertEquals(1L, section.id());
        var question = section.questions().getFirst();
        assertEquals(2L, question.id());
        var answer = question.answers().getFirst();
        assertEquals("correct text", answer.correctAnswerText());
        assertTrue(answer.caseSensitive());
        assertEquals(List.of(0, 1), answer.scoringRules().stream().map(r -> r.correctCount()).toList());
        assertEquals(6L, answer.options().getFirst().id());
        assertTrue(answer.options().getFirst().isCorrect());
        assertEquals(mediaId, section.imageMedia().mediaId());
        assertEquals(section.imageMedia(), question.imageMedia());
        assertEquals(section.imageMedia(), answer.imageMedia());
        assertEquals(section.imageMedia(), answer.options().getFirst().imageMedia());
        assertNull(section.audioMedia());
        assertEquals(1, Collections.frequency(calls, "getUrl"));
    }

    @Test void batchesOneHundredQuestionsWithoutPerQuestionQueries() {
        tree();
        questions = java.util.stream.LongStream.rangeClosed(1, 100).mapToObj(id ->
                Question.builder().id(id).section(sections.getFirst()).orderIndex((int) id).build()).toList();
        answers = questions.stream().map(q -> Answer.builder().id(q.getId()).question(q).orderIndex(1).build()).toList();
        options = List.of(); rules = List.of();
        assertEquals(100, service().get(7L, "teacher").sections().getFirst().questions().size());
        assertEquals(7, calls.stream().filter(c -> !c.equals("getUrl")).count());
        assertEquals(1, Collections.frequency(calls, "findAllByQuestion_IdInOrderByQuestion_IdAscOrderIndexAsc"));
    }

    @Test void rejectsMediaAbsentFromExamRegistryBeforeBuildingUrl() {
        tree(); media = List.of();
        assertThrows(ConflictException.class, () -> service().get(7L, "teacher"));
        assertFalse(calls.contains("getUrl"));
    }

    @Test void resolvesAudioAndKeepsCorrectBoolean() {
        tree();
        var audioId = UUID.randomUUID();
        media = List.of(media.getFirst(), ExamMedia.builder().id(audioId).objectPath("audio.mp3")
                .mediaType(ExamMediaType.AUDIO).build());
        answers.getFirst().setAudioUrl("audio.mp3");
        answers.getFirst().setCorrectBoolean(false);
        var answer = service().get(7L, "teacher").sections().getFirst().questions().getFirst().answers().getFirst();
        assertEquals(audioId, answer.audioMedia().mediaId());
        assertEquals("https://storage.example/audio.mp3", answer.audioMedia().url());
        assertEquals(false, answer.correctBoolean());
        assertEquals(2, Collections.frequency(calls, "getUrl"));
    }

    @Test void rejectsWrongMediaTypeBeforeBuildingUrl() {
        tree(); media.getFirst().setMediaType(ExamMediaType.AUDIO);
        assertThrows(ConflictException.class, () -> service().get(7L, "teacher"));
        assertFalse(calls.contains("getUrl"));
    }

    @Test void sectionWithoutQuestionsReturnsEmptyArray() {
        tree(); questions = List.of(); answers = List.of(); options = List.of(); rules = List.of();
        assertTrue(service().get(7L, "teacher").sections().getFirst().questions().isEmpty());
        assertFalse(calls.contains("findAllByQuestion_IdInOrderByQuestion_IdAscOrderIndexAsc"));
    }

    private void tree() {
        var section = ExamSection.builder().id(1L).orderIndex(1).imageUrl("image.png").build();
        var question = Question.builder().id(2L).section(section).orderIndex(1).imageUrl("image.png").build();
        var answer = Answer.builder().id(3L).question(question).orderIndex(1).imageUrl("image.png")
                .correctAnswerText("correct text").caseSensitive(true).build();
        sections = List.of(section); questions = List.of(question); answers = List.of(answer);
        options = List.of(AnswerOption.builder().id(5L).answer(answer).orderIndex(2).correct(false).build(),
                AnswerOption.builder().id(6L).answer(answer).orderIndex(1).correct(true).imageUrl("image.png").build());
        rules = List.of(QuestionScoringRule.builder().id(8L).answer(answer).correctCount(1).score(BigDecimal.ONE).build(),
                QuestionScoringRule.builder().id(9L).answer(answer).correctCount(0).score(BigDecimal.ZERO).build());
        media = List.of(ExamMedia.builder().id(mediaId).objectPath("image.png").mediaType(ExamMediaType.IMAGE).build());
    }

    private ExamDetailService service() {
        var configuration = new ExamConfigurationService(null, null, null, null) {
            @Override public ExamConfigurationResponse get(Long id, String username) {
                calls.add("configuration");
                if (wrongOwner) throw new ResourceNotFoundException("Not found");
                assertEquals(7L, id); assertEquals("teacher", username);
                return new ExamConfigurationResponse(id, "EX-11-ABCDEF", ExamStatus.DRAFT,
                        BigDecimal.TEN, null, null, List.of());
            }
        };
        return new ExamDetailService(configuration, repository(ExamSectionRepository.class),
                repository(QuestionRepository.class), repository(AnswerRepository.class),
                repository(AnswerOptionRepository.class), repository(QuestionScoringRuleRepository.class),
                repository(ExamMediaRepository.class), repository(StorageService.class));
    }

    private <T> T repository(Class<T> type) {
        return type.cast(Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, (proxy, method, args) -> {
            calls.add(method.getName());
            return switch (method.getName()) {
                case "findAllByExam_IdOrderByOrderIndexAsc" -> sections;
                case "findAllBySection_IdInOrderBySection_IdAscOrderIndexAsc" -> {
                    assertEquals(List.of(1L), args[0]); yield questions;
                }
                case "findAllByQuestion_IdInOrderByQuestion_IdAscOrderIndexAsc" -> {
                    assertEquals(questions.stream().map(Question::getId).toList(), args[0]); yield answers;
                }
                case "findAllByAnswer_IdInOrderByAnswer_IdAscOrderIndexAsc" -> options;
                case "findAllByAnswer_IdInOrderByAnswer_IdAscCorrectCountAsc" -> rules;
                case "findAllByExam_IdAndStatus" -> {
                    assertEquals(7L, args[0]); assertEquals(ExamMediaStatus.ATTACHED, args[1]); yield media;
                }
                case "getUrl" -> "https://storage.example/" + args[0];
                default -> throw new AssertionError("Unexpected call: " + method.getName());
            };
        }));
    }
}
