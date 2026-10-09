package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.dto.exam.CreateCompleteExamRequest;
import com.classmanagement.backend.dto.exam.CreateCompleteExamRequest.Section;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.exception.ExamValidationException;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.*;

@Component
@RequiredArgsConstructor
public class ExamStructureValidator {
    private final Validator validator;
    private static final BigDecimal MAX_SCORE = new BigDecimal("9999.99");

    public Summary validate(CreateCompleteExamRequest request) {
        if (request == null) fail("request", "Thiếu dữ liệu đề thi");
        Map<String, String> errors = new LinkedHashMap<>();
        validator.validate(request).forEach(v -> errors.putIfAbsent(v.getPropertyPath().toString(),
                "Giá trị thiếu hoặc không hợp lệ: " + v.getMessage()));
        if (!errors.isEmpty()) throw new ExamValidationException(errors);
        validateAssignment(request.assignment());
        Summary summary = calculateContent(request.sections());
        if (!summary.mediaTypes().isEmpty() && request.draftToken() == null) fail("draftToken", "Đề có media phải có draft token");
        var assignment = request.assignment();
        if (assignment.answerVisibilityScore() != null && assignment.answerVisibilityScore().compareTo(summary.totalScore()) > 0) {
            fail("assignment.answerVisibilityScore", "Điểm ngưỡng không được vượt quá tổng điểm đề");
        }
        return summary;
    }

    public Summary validateContent(List<CreateCompleteExamRequest.Section> sections) {
        Map<String, String> errors = new LinkedHashMap<>();
        validator.validate(new Content(sections)).forEach(v -> errors.put(v.getPropertyPath().toString(), v.getMessage()));
        if (!errors.isEmpty()) throw new ExamValidationException(errors);
        return calculateContent(sections);
    }

    private Summary calculateContent(List<CreateCompleteExamRequest.Section> sections) {
        Map<UUID, ExamMediaType> media = new LinkedHashMap<>();
        BigDecimal total = BigDecimal.ZERO;
        int questions = 0, answers = 0, options = 0;
        for (int si = 0; si < sections.size(); si++) {
            var section = sections.get(si);
            String sp = "sections[" + si + "]";
            collect(media, section.imageMediaId(), section.audioMediaId(), sp);
            for (int qi = 0; qi < section.questions().size(); qi++) {
                var question = section.questions().get(qi);
                String qp = sp + ".questions[" + qi + "]";
                collect(media, question.imageMediaId(), question.audioMediaId(), qp);
                BigDecimal questionTotal = BigDecimal.ZERO;
                if (++questions > 500) fail("sections", "Đề không được vượt quá 500 câu hỏi");
                for (int ai = 0; ai < question.answers().size(); ai++) {
                    var answer = question.answers().get(ai);
                    String ap = qp + ".answers[" + ai + "]";
                    if (++answers > 2000) fail("sections", "Đề không được vượt quá 2000 nhóm đáp án");
                    options += list(answer.options()).size();
                    if (options > 10000) fail("sections", "Đề không được vượt quá 10000 phương án/ý");
                    validateAnswer(answer, ap);
                    collect(media, answer.imageMediaId(), answer.audioMediaId(), ap);
                    for (int oi = 0; oi < list(answer.options()).size(); oi++) {
                        var option = answer.options().get(oi);
                        String op = ap + ".options[" + oi + "]";
                        if (blank(option.content()) && option.imageMediaId() == null && option.audioMediaId() == null) {
                            fail(op, "Phương án/ý phải có nội dung hoặc media");
                        }
                        collect(media, option.imageMediaId(), option.audioMediaId(), op);
                    }
                    questionTotal = questionTotal.add(answer.points());
                }
                if (question.points().compareTo(questionTotal) != 0) {
                    fail(qp + ".points", "Điểm câu phải bằng tổng điểm các nhóm đáp án");
                }
                total = total.add(questionTotal);
                if (total.compareTo(MAX_SCORE) > 0) fail("sections", "Tổng điểm đề không được vượt quá 9999.99");
            }
        }
        if (media.size() > 500) fail("sections", "Đề không được vượt quá 500 media");
        return new Summary(total.setScale(2), Map.copyOf(media));
    }

    private record Content(@jakarta.validation.constraints.NotEmpty @jakarta.validation.constraints.Size(max = 50)
            List<@jakarta.validation.constraints.NotNull @jakarta.validation.Valid Section> sections) {}

    public void validateAssignment(CreateCompleteExamRequest.Assignment a) {
        var classes = list(a.classIds());
        var students = list(a.studentIds());
        if (new HashSet<>(classes).size() != classes.size()) fail("assignment.classIds", "ID lớp bị trùng");
        if (new HashSet<>(students).size() != students.size()) fail("assignment.studentIds", "ID học sinh bị trùng");
        boolean valid = switch (a.assignmentType()) {
            case ALL -> classes.isEmpty() && students.isEmpty();
            case CLASS -> !classes.isEmpty() && students.isEmpty();
            case STUDENT -> classes.isEmpty() && !students.isEmpty();
        };
        if (!valid) fail("assignment", "Danh sách lớp/học sinh không phù hợp phạm vi giao đề");
        if (a.openTime() != null && a.closeTime() != null && !a.closeTime().isAfter(a.openTime())) {
            fail("assignment.closeTime", "Thời gian đóng phải sau thời gian mở");
        }
        if (a.answerVisibility() == AnswerVisibility.AFTER_SCORE) {
            if (a.answerVisibilityScore() == null) fail("assignment.answerVisibilityScore", "Thiếu điểm ngưỡng");
        } else if (a.answerVisibilityScore() != null) {
            fail("assignment.answerVisibilityScore", "Chỉ AFTER_SCORE được nhận điểm ngưỡng");
        }
    }

    private void validateAnswer(CreateCompleteExamRequest.Answer a, String path) {
        var options = list(a.options());
        var rules = list(a.scoringRules());
        boolean choice = a.answerType() == AnswerType.SINGLE_CHOICE || a.answerType() == AnswerType.MULTIPLE_CHOICE;
        if (a.scoringType() == ScoringType.CORRECT_COUNT && a.answerType() != AnswerType.TRUE_FALSE) {
            fail(path + ".scoringType", "Chấm theo số ý đúng chỉ áp dụng cho nhóm đúng/sai");
        }
        if (a.scoringType() == ScoringType.PER_ANSWER && !rules.isEmpty()) {
            fail(path + ".scoringRules", "Nhóm cộng điểm không nhận quy luật theo số ý đúng");
        }
        if (choice || a.answerType() == AnswerType.TRUE_FALSE) {
            if (options.size() < (choice ? 2 : 1)) fail(path + ".options", "Chưa đủ phương án/ý");
            if (!blank(a.correctAnswerText()) || Boolean.TRUE.equals(a.caseSensitive())) {
                fail(path, "Nhóm lựa chọn/đúng-sai không nhận đáp án văn bản hoặc caseSensitive");
            }
        } else {
            if (!options.isEmpty()) fail(path + ".options", "Loại đáp án này không nhận options");
            if (a.answerType() == AnswerType.ESSAY) {
                if (!blank(a.correctAnswerText()) || Boolean.TRUE.equals(a.caseSensitive())) {
                    fail(path, "Tự luận chấm tay không nhận đáp án tự động");
                }
            } else if (blank(a.correctAnswerText())) fail(path + ".correctAnswerText", "Thiếu đáp án chuẩn");
        }
        if (choice) {
            long correct = options.stream().filter(CreateCompleteExamRequest.Option::isCorrect).count();
            if (correct == 0 || (a.answerType() == AnswerType.SINGLE_CHOICE && correct != 1)) {
                fail(path + ".options", "Trắc nghiệm một lựa chọn cần đúng một phương án đúng; nhiều lựa chọn cần ít nhất một");
            }
            for (var option : options) if (positive(option.points())) {
                fail(path + ".options", "Trắc nghiệm chấm toàn bộ nhóm, không nhận điểm từng phương án");
            }
        }
        if (a.answerType() == AnswerType.TRUE_FALSE) {
            if (a.scoringType() == ScoringType.PER_ANSWER) {
                BigDecimal sum = BigDecimal.ZERO;
                for (var option : options) {
                    if (option.points() == null) fail(path + ".options", "Thiếu điểm từng ý đúng/sai");
                    sum = sum.add(option.points());
                }
                if (sum.compareTo(a.points()) != 0) fail(path + ".points", "Điểm nhóm phải bằng tổng điểm các ý");
            } else {
                for (var option : options) if (positive(option.points())) {
                    fail(path + ".options", "Nhóm tra quy luật không nhận điểm từng ý");
                }
                Map<Integer, BigDecimal> scoreByCount = new HashMap<>();
                for (var rule : rules) {
                    if (rule.correctCount() > options.size() || scoreByCount.put(rule.correctCount(), rule.score()) != null) {
                        fail(path + ".scoringRules", "Số ý đúng bị trùng hoặc vượt số ý của nhóm");
                    }
                }
                if (scoreByCount.size() != options.size() + 1) fail(path + ".scoringRules", "Phải có quy luật cho mọi số ý đúng từ 0 đến N");
                BigDecimal previous = BigDecimal.ZERO;
                for (int count = 0; count <= options.size(); count++) {
                    BigDecimal score = scoreByCount.get(count);
                    if (score == null || (count == 0 && score.signum() != 0) || score.compareTo(previous) < 0) {
                        fail(path + ".scoringRules", "Điểm quy luật phải tăng không giảm và 0 ý đúng được 0 điểm");
                    }
                    previous = score;
                }
                if (previous.compareTo(a.points()) != 0) fail(path + ".points", "Điểm nhóm phải bằng điểm khi đúng toàn bộ ý");
            }
        }
    }

    private void collect(Map<UUID, ExamMediaType> media, UUID image, UUID audio, String path) {
        put(media, image, ExamMediaType.IMAGE, path + ".imageMediaId");
        put(media, audio, ExamMediaType.AUDIO, path + ".audioMediaId");
    }
    private void put(Map<UUID, ExamMediaType> media, UUID id, ExamMediaType type, String path) {
        if (id != null) {
            var existing = media.putIfAbsent(id, type);
            if (existing != null && existing != type) fail(path, "Một media không thể vừa là ảnh vừa là audio");
        }
    }
    public static <T> List<T> list(List<T> items) { return items == null ? List.of() : items; }
    private static boolean blank(String value) { return value == null || value.isBlank(); }
    private static boolean positive(BigDecimal value) { return value != null && value.signum() > 0; }
    public static void fail(String field, String message) { throw new ExamValidationException(Map.of(field, message)); }
    public record Summary(BigDecimal totalScore, Map<UUID, ExamMediaType> mediaTypes) {}
}
