package com.classmanagement.backend.service.exam.pdf;

import static com.classmanagement.backend.service.exam.pdf.PdfExamScopeParser.*;

import com.classmanagement.backend.entity.enums.AnswerType;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.*;

/** Stage two: raw text/layout only. No answer inference, math conversion, points or persistence. */
public final class PdfExamStructureParser {
    public record Region(int page, TextBox box) {}

    public record Issue(String code, String severity, String path, String message, Range source) {}

    public record Option(
            String clientId,
            String label,
            String rawText,
            Boolean isCorrect,
            BigDecimal points,
            List<Region> textRegions) {}

    public record AnswerGroup(
            String clientId,
            AnswerType answerType,
            BigDecimal points,
            String correctAnswerText,
            List<Option> options) {}

    public record Question(
            String clientId,
            int number,
            String rawText,
            String rawStem,
            BigDecimal points,
            Range source,
            AnswerGroup group,
            List<Region> textRegions,
            String explanation,
            Range explanationSource) {}

    public record Section(
            String clientId,
            String label,
            String rawTitle,
            String rawIntroduction,
            AnswerType answerType,
            Integer expectedFirstQuestion,
            Integer expectedLastQuestion,
            Range source,
            List<Question> questions) {}

    public record Structure(
            Selection selection,
            List<Section> sections,
            List<Issue> issues,
            boolean answersResolved,
            boolean latexChecked,
            boolean requiresPoints) {}

    private record Fragment(Line line, int from, int to) {
        String text() {
            return line.text().substring(from, to);
        }
    }

    private record Marker(String label, int start, int end) {}

    private static final class SectionBuilder {
        String label, title, id;
        Position start;
        final List<String> intro = new ArrayList<>();
        final List<Question> questions = new ArrayList<>();
    }

    private static final class QuestionBuilder {
        int number;
        Position start;
        final List<Fragment> fragments = new ArrayList<>();
    }

    public Structure parse(Index index, int examNumber) {
        var layout = index.layout();
        var selection = index.select(examNumber);
        var lines = index.lines(selection.questions());
        var sections = new ArrayList<Section>();
        var issues = new ArrayList<Issue>();
        SectionBuilder section = null;
        QuestionBuilder question = null;
        int questionCount = 0, sectionCount = 0;
        for (int lineIndex = 0; lineIndex < lines.size(); lineIndex++) {
            var line = lines.get(lineIndex);
            if (layout.isFooter(line)) continue;
            var heading = layout.section().matcher(line.text());
            var questionHeading = layout.question().matcher(line.text());
            boolean labelFound = questionHeading.find();
            boolean recovered = false;
            if (!labelFound && lineIndex + 1 < lines.size()) {
                var split = layout.splitQuestion().matcher(line.text());
                var next = lines.get(lineIndex + 1);
                if (split.find()
                        && next.page() == line.page()
                        && next.text().stripLeading().startsWith(":")
                        && Math.abs(next.top() - line.top()) < 24) {
                    questionHeading = split;
                    labelFound = true;
                    recovered = true;
                }
            }
            if (heading.matches()) {
                if (++sectionCount > 50)
                    throw new ScopeException(ErrorCode.PDF_LIMIT_EXCEEDED, "Vượt giới hạn 50 phần");
                if (section != null) {
                    if (question != null)
                        section.questions.add(
                                question(layout, question, section, line.position(), issues));
                    sections.add(section(layout, section, line.position(), issues));
                }
                question = null;
                section = new SectionBuilder();
                section.label = heading.group(1).toUpperCase(Locale.ROOT);
                section.title = line.text().trim();
                section.start = line.position();
                section.id = "exam-" + examNumber + "-section-" + (sections.size() + 1);
                section.intro.add(line.text());
            } else if (labelFound && questionHeader(line, questionHeading)) {
                if (++questionCount > 500)
                    throw new ScopeException(ErrorCode.PDF_LIMIT_EXCEEDED, "Vượt giới hạn 500 câu");
                if (section == null) {
                    issues.add(
                            new Issue(
                                    "QUESTION_WITHOUT_SECTION",
                                    "BLOCKING",
                                    "sections",
                                    "Câu hỏi chưa có phần xác định",
                                    new Range(line.position(), selection.questions().end())));
                    continue;
                }
                if (question != null)
                    section.questions.add(
                            question(layout, question, section, line.position(), issues));
                question = new QuestionBuilder();
                question.number = Integer.parseInt(questionHeading.group(1));
                question.start = line.position();
                if (recovered || layout.uncertainQuestionLabel(questionHeading.group()))
                    issues.add(
                            new Issue(
                                    "QUESTION_LABEL_UNCERTAIN",
                                    "BLOCKING",
                                    section.id,
                                    "Nhãn câu bị tách/mất ký tự trong PDF; cần kiểm tra vùng gốc",
                                    new Range(line.position(), selection.questions().end())));
                if (!line.text().substring(0, questionHeading.start()).isBlank()) {
                    question.fragments.add(new Fragment(line, 0, questionHeading.start()));
                    issues.add(
                            new Issue(
                                    "QUESTION_HEADER_REORDERED",
                                    "WARNING",
                                    section.id,
                                    "Ký hiệu/text bị PDF đặt trước nhãn câu; đã giữ nguyên để kiểm"
                                            + " tra thứ tự và LaTeX",
                                    new Range(line.position(), selection.questions().end())));
                }
                question.fragments.add(
                        new Fragment(line, questionHeading.end(), line.text().length()));
            } else if (question != null)
                question.fragments.add(new Fragment(line, 0, line.text().length()));
            else if (section != null) section.intro.add(line.text());
        }
        if (section != null) {
            if (question != null)
                section.questions.add(
                        question(layout, question, section, selection.questions().end(), issues));
            sections.add(section(layout, section, selection.questions().end(), issues));
        }
        if (sections.isEmpty())
            issues.add(
                    new Issue(
                            "SECTION_UNRECOGNIZED",
                            "BLOCKING",
                            "sections",
                            "Không nhận diện được phần của đề",
                            selection.questions()));
        var labels = new HashSet<String>();
        for (var item : sections)
            if (!labels.add(item.label()))
                issues.add(
                        new Issue(
                                "SECTION_DUPLICATE",
                                "BLOCKING",
                                item.clientId(),
                                "Nhãn phần bị lặp, cần kiểm tra",
                                item.source()));
        // Extracted formulas can be visibly wrong even when the text is non-empty.
        issues.add(
                new Issue(
                        "LATEX_REVIEW_REQUIRED",
                        "BLOCKING",
                        "sections",
                        "Đây là text thô: chưa nhận dạng và kiểm tra LaTeX",
                        selection.questions()));
        issues.add(
                new Issue(
                        "ANSWERS_REQUIRED",
                        "BLOCKING",
                        "sections",
                        "Chưa ghép đáp án và lời giải ở bước 2",
                        selection.solutions()));
        issues.add(
                new Issue(
                        "POINTS_REQUIRED",
                        "BLOCKING",
                        "sections",
                        "Giáo viên tự nhập điểm sau import",
                        selection.questions()));
        return new Structure(
                selection, List.copyOf(sections), List.copyOf(issues), false, false, true);
    }

    private static Section section(
            PdfExamLayout layout, SectionBuilder section, Position end, List<Issue> issues) {
        String intro = String.join("\n", section.intro);
        var type = layout.answerType(intro);
        var source = new Range(section.start, end);
        if (type == null)
            issues.add(
                    new Issue(
                            "SECTION_TYPE_UNSUPPORTED",
                            "BLOCKING",
                            section.id,
                            "Chưa nhận diện được một trong ba loại câu hỗ trợ",
                            source));
        var expected = layout.expectedQuestions().matcher(fold(intro));
        Integer first = null, last = null;
        if (expected.find()) {
            first = Integer.valueOf(expected.group(1));
            last = Integer.valueOf(expected.group(2));
            final int start = first;
            boolean matches =
                    first > 0
                            && last >= first
                            && last - first < 500
                            && section.questions.size() == last - first + 1;
            if (matches)
                for (int i = 0; i < section.questions.size(); i++)
                    if (section.questions.get(i).number() != start + i) matches = false;
            if (!matches)
                issues.add(
                        new Issue(
                                "QUESTION_COUNT_MISMATCH",
                                "BLOCKING",
                                section.id,
                                "Số/thứ tự câu không khớp khoảng được công bố trong tiêu đề",
                                source));
        }
        Set<Integer> numbers = new HashSet<>();
        int previous = 0;
        for (var q : section.questions) {
            if (!numbers.add(q.number()) || q.number() != previous + 1)
                issues.add(
                        new Issue(
                                "QUESTION_SEQUENCE_UNCERTAIN",
                                "BLOCKING",
                                q.clientId(),
                                "Số câu bị lặp, thiếu hoặc sai thứ tự",
                                q.source()));
            previous = q.number();
        }
        if (section.questions.isEmpty())
            issues.add(
                    new Issue(
                            "SECTION_EMPTY",
                            "BLOCKING",
                            section.id,
                            "Phần không có câu hỏi",
                            source));
        return new Section(
                section.id,
                section.label,
                section.title,
                intro,
                type,
                first,
                last,
                source,
                List.copyOf(section.questions));
    }

    private static Question question(
            PdfExamLayout layout,
            QuestionBuilder question,
            SectionBuilder section,
            Position end,
            List<Issue> issues) {
        String id = section.id + "-question-" + (section.questions.size() + 1);
        var source = new Range(question.start, end);
        String raw = String.join("\n", question.fragments.stream().map(Fragment::text).toList());
        AnswerType type = layout.answerType(String.join("\n", section.intro));
        Pattern pattern =
                type == AnswerType.SINGLE_CHOICE
                        ? layout.choice()
                        : type == AnswerType.TRUE_FALSE ? layout.booleanOption() : null;
        List<Marker> markers = new ArrayList<>();
        if (pattern != null) {
            var matcher = pattern.matcher(raw);
            while (matcher.find()) {
                if (markers.size() >= 50)
                    throw new ScopeException(
                            ErrorCode.PDF_LIMIT_EXCEEDED,
                            "Vượt giới hạn nhãn phương án trong một câu");
                markers.add(new Marker(matcher.group(1), matcher.start(), matcher.end()));
            }
        }
        if (type == AnswerType.SINGLE_CHOICE) {
            int firstA = -1;
            for (int i = 0; i < markers.size(); i++)
                if (markers.get(i).label().equals("A")) {
                    firstA = i;
                    break;
                }
            if (firstA > 0
                    && markers.subList(firstA, markers.size()).stream()
                            .map(Marker::label)
                            .toList()
                            .equals(List.of("A", "B", "C", "D")))
                markers = new ArrayList<>(markers.subList(firstA, markers.size()));
        }
        List<Option> options = new ArrayList<>();
        String stem = markers.isEmpty() ? raw : raw.substring(0, markers.getFirst().start());
        if (pattern != null) {
            var labels = markers.stream().map(Marker::label).toList();
            var expected =
                    type == AnswerType.SINGLE_CHOICE
                            ? List.of("A", "B", "C", "D")
                            : List.of("a", "b", "c", "d");
            if (!labels.equals(expected))
                issues.add(
                        new Issue(
                                "OPTION_BOUNDARY_UNCERTAIN",
                                "BLOCKING",
                                id,
                                "Phải kiểm tra nhãn và thứ tự bốn phương án/ý: " + labels,
                                source));
            for (int i = 0; i < markers.size(); i++) {
                var marker = markers.get(i);
                int stop = i + 1 < markers.size() ? markers.get(i + 1).start() : raw.length();
                String content = raw.substring(marker.end(), stop).trim();
                if (content.isBlank() || content.matches("[\\s.]+"))
                    issues.add(
                            new Issue(
                                    "OPTION_CONTENT_UNRESOLVED",
                                    "BLOCKING",
                                    id,
                                    "Ý/phương án "
                                            + marker.label()
                                            + " chưa có text; có thể cần lấy ảnh",
                                    source));
                options.add(
                        new Option(
                                id + "-option-" + (i + 1),
                                marker.label(),
                                content,
                                null,
                                null,
                                regions(question.fragments, marker.start(), stop)));
            }
        }
        if (raw.isBlank())
            issues.add(
                    new Issue(
                            "QUESTION_CONTENT_UNRESOLVED",
                            "BLOCKING",
                            id,
                            "Nội dung câu trống hoặc nằm trong ảnh",
                            source));
        if (stem.isBlank())
            issues.add(
                    new Issue(
                            "QUESTION_STEM_UNCERTAIN",
                            "BLOCKING",
                            id,
                            "Chưa xác định được phần nội dung trước đáp án",
                            source));
        return new Question(
                id,
                question.number,
                raw.trim(),
                stem.trim(),
                null,
                source,
                new AnswerGroup(id + "-group-1", type, null, null, List.copyOf(options)),
                regions(question.fragments, 0, raw.length()),
                null,
                null);
    }

    private static List<Region> regions(List<Fragment> fragments, int start, int end) {
        var regions = new ArrayList<Region>();
        int offset = 0;
        for (var fragment : fragments) {
            int length = fragment.to() - fragment.from();
            int lo = Math.max(start - offset, 0), hi = Math.min(end - offset, length);
            if (lo < hi) {
                int from = fragment.from() + lo, to = fragment.from() + hi;
                var boxes =
                        fragment.line().spans().stream()
                                .filter(s -> s.start() < to && s.end() > from)
                                .map(TextSpan::box)
                                .toList();
                if (!boxes.isEmpty())
                    regions.add(
                            new Region(
                                    fragment.line().page(),
                                    new TextBox(
                                            (float)
                                                            boxes.stream()
                                                                    .mapToDouble(TextBox::left)
                                                                    .min()
                                                                    .orElseThrow(),
                                                    (float)
                                                            boxes.stream()
                                                                    .mapToDouble(TextBox::top)
                                                                    .min()
                                                                    .orElseThrow(),
                                            (float)
                                                            boxes.stream()
                                                                    .mapToDouble(TextBox::right)
                                                                    .max()
                                                                    .orElseThrow(),
                                                    (float)
                                                            boxes.stream()
                                                                    .mapToDouble(TextBox::bottom)
                                                                    .max()
                                                                    .orElseThrow())));
            }
            offset += length + 1;
        }
        return List.copyOf(regions);
    }

    static boolean questionHeader(Line line, Matcher match) {
        if (line.text().substring(0, match.start()).isBlank()) return true;
        // PDF content stream can place a formula fragment before a physically leftmost question
        // label.
        // A prose reference in the middle of a line must not become a new question.
        var label =
                line.spans().stream()
                        .filter(s -> s.start() <= match.start() && s.end() > match.start())
                        .findFirst();
        return label.isPresent() && label.get().box().left() <= line.left() + 3;
    }

    private static String fold(String text) {
        return Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .toUpperCase(Locale.ROOT);
    }
}
