package com.classmanagement.backend.service.exam.attempt;

import static com.classmanagement.backend.service.exam.validation.ExamStructureValidator.fail;

import com.classmanagement.backend.dto.exam.*;
import com.classmanagement.backend.entity.enums.*;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.*;

/** Pure grading/answer validation: no repository or network calls. */
public final class ExamScoringCalculator {
    private ExamScoringCalculator() {}

    public record GroupScore(Long answerId, BigDecimal score, Boolean correct) {}

    public record QuestionScore(
            Long questionId, BigDecimal autoScore, BigDecimal manualScore, GradingStatus status) {}

    public record Scores(
            List<GroupScore> groups,
            List<QuestionScore> questions,
            List<ExamAttemptResponse.SectionScore> sections,
            BigDecimal autoScore,
            BigDecimal manualScore,
            boolean pending) {}

    public static Map<Long, ExamAttemptPayload.Value> validate(
            List<ExamDetailResponse.Section> sections, List<ExamAttemptPayload.Value> values) {
        var groups = groups(sections);
        var result = new LinkedHashMap<Long, ExamAttemptPayload.Value>();
        for (int i = 0; i < values.size(); i++) {
            var value = values.get(i);
            String path = "answers[" + i + "]";
            var group = groups.get(value.answerId());
            if (group == null || result.putIfAbsent(value.answerId(), value) != null)
                fail(path, "Nhóm đáp án không thuộc đề hoặc bị trùng");
            var selected = list(value.selectedOptionIds());
            var booleans = list(value.booleanAnswers());
            var ids = new HashSet<Long>();
            var optionIds =
                    new HashSet<>(
                            group.options().stream().map(ExamDetailResponse.Option::id).toList());
            for (Long id : selected)
                if (!optionIds.contains(id) || !ids.add(id))
                    fail(path, "Option không thuộc nhóm hoặc bị trùng");
            ids.clear();
            for (var item : booleans)
                if (!optionIds.contains(item.optionId())
                        || !ids.add(item.optionId())
                        || item.value() == null) fail(path, "Ý đúng/sai không hợp lệ");
            boolean text = value.text() != null && !value.text().isBlank();
            switch (group.answerType()) {
                case SINGLE_CHOICE -> {
                    if (selected.size() > 1 || !booleans.isEmpty() || text)
                        fail(path, "SINGLE_CHOICE chỉ nhận tối đa một option");
                }
                case MULTIPLE_CHOICE -> {
                    if (!booleans.isEmpty() || text)
                        fail(path, "MULTIPLE_CHOICE chỉ nhận selectedOptionIds");
                }
                case TRUE_FALSE -> {
                    if (!selected.isEmpty() || text)
                        fail(path, "TRUE_FALSE chỉ nhận booleanAnswers");
                }
                case SHORT_ANSWER, ESSAY -> {
                    if (!selected.isEmpty() || !booleans.isEmpty())
                        fail(path, "Câu văn bản chỉ nhận text");
                }
            }
        }
        return result;
    }

    public static Map<Long, ExamDetailResponse.Answer> groups(
            List<ExamDetailResponse.Section> sections) {
        var result = new LinkedHashMap<Long, ExamDetailResponse.Answer>();
        for (var s : sections)
            for (var q : s.questions()) for (var a : q.answers()) result.put(a.id(), a);
        return result;
    }

    public static Scores score(
            List<ExamDetailResponse.Section> sections,
            Map<Long, ExamAttemptPayload.Value> values,
            Map<Long, BigDecimal> manual) {
        List<GroupScore> groups = new ArrayList<>();
        List<QuestionScore> questions = new ArrayList<>();
        List<ExamAttemptResponse.SectionScore> sectionScores = new ArrayList<>();
        BigDecimal auto = BigDecimal.ZERO, hand = BigDecimal.ZERO;
        boolean pending = false;
        for (var s : sections) {
            BigDecimal sectionAuto = BigDecimal.ZERO, sectionManual = BigDecimal.ZERO;
            for (var q : s.questions()) {
                BigDecimal qa = BigDecimal.ZERO, qm = BigDecimal.ZERO;
                boolean qp = false, hasManual = false;
                for (var a : q.answers()) {
                    var value = values.get(a.id());
                    BigDecimal score = BigDecimal.ZERO;
                    Boolean correct = false;
                    if (a.answerType() == AnswerType.ESSAY) {
                        boolean answered =
                                value != null && value.text() != null && !value.text().isBlank();
                        score = answered ? manual.get(a.id()) : BigDecimal.ZERO;
                        if (score != null
                                && (score.signum() < 0 || score.compareTo(a.points()) > 0))
                            fail("grades", "Điểm tự luận vượt điểm nhóm");
                        qp |= score == null;
                        hasManual |= answered && score != null;
                        correct = null;
                        if (score != null) qm = qm.add(score);
                    } else {
                        if (value != null)
                            switch (a.answerType()) {
                                case SINGLE_CHOICE, MULTIPLE_CHOICE -> {
                                    Set<Long> expected =
                                            new HashSet<>(
                                                    a.options().stream()
                                                            .filter(
                                                                    o ->
                                                                            Boolean.TRUE.equals(
                                                                                    o.isCorrect()))
                                                            .map(ExamDetailResponse.Option::id)
                                                            .toList());
                                    correct =
                                            expected.equals(
                                                    new HashSet<>(list(value.selectedOptionIds())));
                                    if (correct) score = a.points();
                                }
                                case SHORT_ANSWER -> {
                                    correct =
                                            value.text() != null
                                                    && !value.text().isBlank()
                                                    && text(value.text(), a.caseSensitive())
                                                            .equals(
                                                                    text(
                                                                            a.correctAnswerText(),
                                                                            a.caseSensitive()));
                                    if (correct) score = a.points();
                                }
                                case TRUE_FALSE -> {
                                    Map<Long, Boolean> answers = new HashMap<>();
                                    for (var item : list(value.booleanAnswers()))
                                        answers.put(item.optionId(), item.value());
                                    int count = 0;
                                    for (var option : a.options())
                                        if (answers.containsKey(option.id())
                                                && Objects.equals(
                                                        answers.get(option.id()),
                                                        option.isCorrect())) {
                                            count++;
                                            if (a.scoringType() == ScoringType.PER_ANSWER)
                                                score = score.add(option.points());
                                        }
                                    correct = count == a.options().size();
                                    if (a.scoringType() == ScoringType.CORRECT_COUNT) {
                                        final int matched = count;
                                        score =
                                                a.scoringRules().stream()
                                                        .filter(r -> r.correctCount() == matched)
                                                        .findFirst()
                                                        .orElseThrow(
                                                                () ->
                                                                        new IllegalStateException(
                                                                                "Thiếu rule chấm"
                                                                                    + " đúng/sai"))
                                                        .score();
                                    }
                                }
                                default ->
                                        throw new IllegalStateException(
                                                "Loại đáp án không được hỗ trợ");
                            }
                        qa = qa.add(score);
                    }
                    groups.add(new GroupScore(a.id(), score, correct));
                }
                questions.add(
                        new QuestionScore(
                                q.id(),
                                qa,
                                qm,
                                qp
                                        ? GradingStatus.PENDING
                                        : hasManual
                                                ? GradingStatus.MANUAL_GRADED
                                                : GradingStatus.AUTO_GRADED));
                sectionAuto = sectionAuto.add(qa);
                sectionManual = sectionManual.add(qm);
                pending |= qp;
            }
            sectionScores.add(
                    new ExamAttemptResponse.SectionScore(
                            s.id(), sectionAuto, sectionManual, sectionAuto.add(sectionManual)));
            auto = auto.add(sectionAuto);
            hand = hand.add(sectionManual);
        }
        return new Scores(groups, questions, sectionScores, auto, hand, pending);
    }

    private static String text(String value, Boolean sensitive) {
        String normalized =
                Normalizer.normalize(value == null ? "" : value.trim(), Normalizer.Form.NFC);
        return Boolean.TRUE.equals(sensitive) ? normalized : normalized.toLowerCase(Locale.ROOT);
    }

    private static <T> List<T> list(List<T> list) {
        return list == null ? List.of() : list;
    }
}
