package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.dto.exam.ExamDetailResponse;
import com.classmanagement.backend.entity.Answer;
import com.classmanagement.backend.entity.AnswerOption;
import com.classmanagement.backend.entity.ExamMedia;
import com.classmanagement.backend.entity.Question;
import com.classmanagement.backend.entity.QuestionScoringRule;
import com.classmanagement.backend.entity.enums.ExamMediaStatus;
import com.classmanagement.backend.entity.enums.ExamMediaType;
import com.classmanagement.backend.exception.ConflictException;
import com.classmanagement.backend.repository.exam.AnswerOptionRepository;
import com.classmanagement.backend.repository.exam.AnswerRepository;
import com.classmanagement.backend.repository.exam.ExamMediaRepository;
import com.classmanagement.backend.repository.exam.ExamSectionRepository;
import com.classmanagement.backend.repository.exam.QuestionRepository;
import com.classmanagement.backend.repository.exam.QuestionScoringRuleRepository;
import com.classmanagement.backend.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamDetailService {
    private final ExamConfigurationService configurationService;
    private final ExamSectionRepository sectionRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final AnswerOptionRepository optionRepository;
    private final QuestionScoringRuleRepository ruleRepository;
    private final ExamMediaRepository mediaRepository;
    private final StorageService storageService;

    // All aggregate reads share one PostgreSQL snapshot, including configuration.
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public ExamDetailResponse get(Long examId, String username) {
        var config = configurationService.get(examId, username);
        var sections = sectionRepository.findAllByExam_IdOrderByOrderIndexAsc(examId);
        var sectionIds = sections.stream().map(s -> s.getId()).toList();
        List<Question> questions = sectionIds.isEmpty() ? List.of()
                : questionRepository.findAllBySection_IdInOrderBySection_IdAscOrderIndexAsc(sectionIds);
        var questionIds = questions.stream().map(Question::getId).toList();
        List<Answer> answers = questionIds.isEmpty() ? List.of()
                : answerRepository.findAllByQuestion_IdInOrderByQuestion_IdAscOrderIndexAsc(questionIds);
        var answerIds = answers.stream().map(Answer::getId).toList();
        List<AnswerOption> options = answerIds.isEmpty() ? List.of()
                : optionRepository.findAllByAnswer_IdInOrderByAnswer_IdAscOrderIndexAsc(answerIds);
        List<QuestionScoringRule> rules = answerIds.isEmpty() ? List.of()
                : ruleRepository.findAllByAnswer_IdInOrderByAnswer_IdAscCorrectCountAsc(answerIds);
        Map<String, ExamMedia> mediaByPath = sections.isEmpty() ? Map.of()
                : mediaRepository.findAllByExam_IdAndStatus(examId, ExamMediaStatus.ATTACHED).stream()
                        .collect(Collectors.toMap(ExamMedia::getObjectPath, Function.identity()));
        var media = new MediaResolver(mediaByPath, storageService);
        var rulesByAnswer = grouped(rules, r -> r.getAnswer().getId(),
                Comparator.comparing(QuestionScoringRule::getCorrectCount));
        var optionsByAnswer = grouped(options, o -> o.getAnswer().getId(),
                Comparator.comparing(AnswerOption::getOrderIndex));
        var answersByQuestion = grouped(answers, a -> a.getQuestion().getId(),
                Comparator.comparing(Answer::getOrderIndex));
        var questionsBySection = grouped(questions, q -> q.getSection().getId(),
                Comparator.comparing(Question::getOrderIndex));

        var sectionResponses = sections.stream().sorted(Comparator.comparing(s -> s.getOrderIndex())).map(s ->
                new ExamDetailResponse.Section(s.getId(), s.getOrderIndex(), s.getTitle(), s.getDescription(),
                        s.getPoints(), media.image(s.getImageUrl()), media.audio(s.getAudioUrl()),
                        questionsBySection.getOrDefault(s.getId(), List.of()).stream().map(q ->
                                questionResponse(q, answersByQuestion, optionsByAnswer, rulesByAnswer, media))
                                .toList())).toList();
        return new ExamDetailResponse(config.id(), config.code(), config.status(), config.maxScore(),
                config.updatedAt(), config.basicInfo(), config.assignments(), sectionResponses, config.revision());
    }

    private static ExamDetailResponse.Question questionResponse(Question question,
            Map<Long, List<Answer>> answers, Map<Long, List<AnswerOption>> options,
            Map<Long, List<QuestionScoringRule>> rules, MediaResolver media) {
        return new ExamDetailResponse.Question(question.getId(), question.getOrderIndex(), question.getContent(),
                question.getPoints(), media.image(question.getImageUrl()), media.audio(question.getAudioUrl()),
                answers.getOrDefault(question.getId(), List.of()).stream().map(a -> answerResponse(a,
                        options.getOrDefault(a.getId(), List.of()), rules.getOrDefault(a.getId(), List.of()), media))
                        .toList());
    }

    private static ExamDetailResponse.Answer answerResponse(Answer answer, List<AnswerOption> options,
            List<QuestionScoringRule> rules, MediaResolver media) {
        return new ExamDetailResponse.Answer(answer.getId(), answer.getOrderIndex(), answer.getAnswerType(),
                answer.getContent(), answer.getPoints(), answer.getScoringType(), answer.getCorrectAnswerText(),
                answer.getCorrectBoolean(), answer.getCaseSensitive(), media.image(answer.getImageUrl()),
                media.audio(answer.getAudioUrl()), options.stream().map(o -> new ExamDetailResponse.Option(
                        o.getId(), o.getOrderIndex(), o.getContent(), o.getCorrect(), o.getPoints(),
                        media.image(o.getImageUrl()), media.audio(o.getAudioUrl()))).toList(),
                rules.stream().map(r -> new ExamDetailResponse.ScoringRule(r.getId(), r.getCorrectCount(),
                        r.getScore())).toList());
    }

    private static <T> Map<Long, List<T>> grouped(List<T> items, Function<T, Long> parentId,
            Comparator<T> order) {
        return items.stream().sorted(order).collect(Collectors.groupingBy(parentId));
    }

    private static class MediaResolver {
        private final Map<String, ExamMedia> mediaByPath;
        private final StorageService storage;
        private final Map<String, ExamDetailResponse.Media> cache = new HashMap<>();

        MediaResolver(Map<String, ExamMedia> mediaByPath, StorageService storage) {
            this.mediaByPath = mediaByPath;
            this.storage = storage;
        }

        ExamDetailResponse.Media image(String path) { return resolve(path, ExamMediaType.IMAGE); }
        ExamDetailResponse.Media audio(String path) { return resolve(path, ExamMediaType.AUDIO); }

        private ExamDetailResponse.Media resolve(String path, ExamMediaType type) {
            if (path == null || path.isBlank()) return null;
            var item = mediaByPath.get(path);
            if (item == null || item.getMediaType() != type) {
                throw new ConflictException("Media của đề thi không khớp dữ liệu đã lưu. Cần kiểm tra lại dữ liệu.");
            }
            return cache.computeIfAbsent(path,
                    ignored -> new ExamDetailResponse.Media(item.getId(), storage.getUrl(path)));
        }
    }
}
