package com.classmanagement.backend.dto.exam;

import com.classmanagement.backend.entity.enums.AnswerType;
import com.classmanagement.backend.entity.enums.ScoringType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;


public record UpdateExamContentRequest(@NotNull @Min(0) Long revision, UUID draftToken,
        @NotEmpty @Size(max = 50) List<@NotNull @Valid Section> sections) {
    private static <T> List<T> list(List<T> items) { return items == null ? List.of() : items; }
    public interface Node { Long id(); String clientId(); }
    public record Section(@Positive Long id, @Size(max = 100) String clientId,
            String title, String description, UUID imageMediaId, UUID audioMediaId,
            @NotEmpty @Size(max = 100) List<@NotNull @Valid Question> questions) implements Node {
        public CreateCompleteExamRequest.Section toCreate() {
            return new CreateCompleteExamRequest.Section(title, description, imageMediaId, audioMediaId,
                    questions.stream().map(Question::toCreate).toList());
        }
    }
    public record Question(@Positive Long id, @Size(max = 100) String clientId,
            String content, UUID imageMediaId, UUID audioMediaId, BigDecimal points,
            @NotEmpty @Size(max = 20) List<@NotNull @Valid Answer> answers) implements Node {
        public CreateCompleteExamRequest.Question toCreate() {
            return new CreateCompleteExamRequest.Question(content, imageMediaId, audioMediaId, points,
                    answers.stream().map(Answer::toCreate).toList());
        }
    }
    public record Answer(@Positive Long id, @Size(max = 100) String clientId,
            AnswerType answerType, String content, UUID imageMediaId, UUID audioMediaId, BigDecimal points,
            ScoringType scoringType, String correctAnswerText, Boolean caseSensitive,
            @Size(max = 50) List<@NotNull @Valid Option> options,
            @Size(max = 51) List<@NotNull @Valid Rule> scoringRules) implements Node {
        public CreateCompleteExamRequest.Answer toCreate() {
            return new CreateCompleteExamRequest.Answer(answerType, content, imageMediaId, audioMediaId, points,
                    scoringType, correctAnswerText, caseSensitive, list(options).stream().map(Option::toCreate).toList(),
                    list(scoringRules).stream().map(Rule::toCreate).toList());
        }
    }
    public record Option(@Positive Long id, @Size(max = 100) String clientId,
            String content, UUID imageMediaId, UUID audioMediaId, Boolean isCorrect, BigDecimal points) implements Node {
        public CreateCompleteExamRequest.Option toCreate() {
            return new CreateCompleteExamRequest.Option(content, imageMediaId, audioMediaId, isCorrect, points);
        }
    }
    public record Rule(@Positive Long id, @Size(max = 100) String clientId,
            Integer correctCount, BigDecimal score) implements Node {
        public CreateCompleteExamRequest.ScoringRule toCreate() {
            return new CreateCompleteExamRequest.ScoringRule(correctCount, score);
        }
    }
}

