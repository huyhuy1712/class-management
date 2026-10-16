package com.classmanagement.backend.service.exam.pdf;

import static com.classmanagement.backend.service.exam.pdf.PdfExamScopeParser.*;
import static com.classmanagement.backend.service.exam.pdf.PdfExamStructureParser.*;

import com.classmanagement.backend.entity.enums.AnswerType;

import java.util.*;

/**
 * Stage three: associate explicit source evidence, never solve a question or infer a missing
 * answer.
 */
public final class PdfExamSolutionParser {
    /** Source is teacher-only. It must never be used as student question media. */
    public record Evidence(
            String questionId,
            String kind,
            String label,
            String rawValue,
            String value,
            Range source) {}

    public record Result(Structure structure, List<Evidence> evidence) {}

    private record Key(String section, int question) {}

    private record Slice(Line line, int from, int to) {}

    private static final class Block {
        final Key key;
        final List<Line> lines = new ArrayList<>();
        final Position start;
        Position end;
        boolean trusted = true;

        Block(Key key, Line line) {
            this.key = key;
            this.start = line.position();
        }

        Range range() {
            return new Range(start, end);
        }
    }

    private static final class Choice {
        final String label;
        final List<Slice> slices = new ArrayList<>();
        final Region anchor;

        Choice(String label, Region anchor) {
            this.label = label;
            this.anchor = anchor;
        }
    }

    public Result parse(Index index, Structure original) {
        Objects.requireNonNull(index);
        Objects.requireNonNull(original);
        if (!index.select(original.selection().examNumber()).equals(original.selection()))
            throw new IllegalArgumentException("Phạm vi đề và chỉ mục không khớp");
        var layout = index.layout();
        var issues = new ArrayList<Issue>();
        var evidence = new ArrayList<Evidence>();
        var highlightsByPage =
                index.highlights().stream()
                        .collect(
                                java.util.stream.Collectors.groupingBy(
                                        PdfExamHighlightReader.Highlight::page));
        original.issues().stream()
                .filter(i -> !i.code().equals("ANSWERS_REQUIRED"))
                .forEach(issues::add);
        var blocks = blocks(index, original.selection(), issues);
        var used = new HashSet<Key>();
        var sections = new ArrayList<Section>();
        boolean complete = true;
        for (var section : original.sections()) {
            var questions = new ArrayList<Question>();
            var counts = new HashMap<Integer, Integer>();
            section.questions().forEach(q -> counts.merge(q.number(), 1, Integer::sum));
            long sameSections =
                    original.sections().stream()
                            .filter(s -> s.label().equals(section.label()))
                            .count();
            for (var question : section.questions()) {
                var key = new Key(section.label(), question.number());
                used.add(key);
                var matches = blocks.getOrDefault(key, List.of());
                if (matches.size() != 1
                        || counts.get(question.number()) != 1
                        || sameSections != 1) {
                    issue(
                            issues,
                            matches.isEmpty() ? "SOLUTION_MISSING" : "SOLUTION_AMBIGUOUS",
                            question.clientId(),
                            "Không ghép duy nhất được lời giải theo phần và số câu",
                            question.source());
                    questions.add(question);
                    complete = false;
                    continue;
                }
                var block = matches.getFirst();
                if (!block.trusted) {
                    questions.add(question);
                    complete = false;
                    continue;
                }
                int body = -1;
                for (int i = 0; i < block.lines.size(); i++)
                    if (layout.explanationHeading()
                            .matcher(normalize(block.lines.get(i).text()))
                            .matches()) {
                        if (body >= 0) {
                            body = -2;
                            break;
                        }
                        body = i;
                    }
                if (body < 0) {
                    issue(
                            issues,
                            "EXPLANATION_BOUNDARY_UNCERTAIN",
                            question.clientId(),
                            "Thiếu hoặc trùng nhãn bắt đầu lời giải",
                            block.range());
                    questions.add(question);
                    complete = false;
                    continue;
                }
                var explanationLines = block.lines.subList(body + 1, block.lines.size());
                String explanation =
                        String.join("\n", explanationLines.stream().map(Line::text).toList())
                                .strip();
                var explanationSource = new Range(block.lines.get(body).position(), block.end);
                var local = new ArrayList<Evidence>();
                var group = question.group();
                if (group.answerType() == AnswerType.SINGLE_CHOICE) {
                    choiceEvidence(index, highlightsByPage, block, body, question, local, issues);
                    for (var line : explanationLines) {
                        var match = layout.choiceConclusion().matcher(normalize(line.text()));
                        if (match.matches())
                            local.add(
                                    new Evidence(
                                            question.clientId(),
                                            "EXPLICIT_CHOICE",
                                            match.group(1),
                                            line.text(),
                                            match.group(1),
                                            lineRange(line)));
                    }
                } else if (group.answerType() == AnswerType.TRUE_FALSE) {
                    for (var line : explanationLines) {
                        String normalized = normalize(line.text());
                        var matcher = layout.booleanConclusion().matcher(normalized);
                        var row = new ArrayList<Evidence>();
                        while (matcher.find())
                            row.add(
                                    new Evidence(
                                            question.clientId(),
                                            "BOOLEAN_CONCLUSION",
                                            matcher.group(1).toLowerCase(Locale.ROOT),
                                            line.text(),
                                            layout.booleanValue(matcher.group(2))
                                                    .map(Object::toString)
                                                    .orElse(null),
                                            lineRange(line)));
                        // Only pure conclusion rows, not words 'đúng/sai' inside mathematical
                        // reasoning.
                        if (!row.isEmpty()
                                && layout.booleanConclusion()
                                        .matcher(normalized)
                                        .replaceAll("")
                                        .matches("[\\s,;.:]*")) local.addAll(row);
                    }
                } else if (group.answerType() == AnswerType.SHORT_ANSWER) {
                    for (var line : explanationLines) {
                        var matcher = layout.shortConclusion().matcher(normalize(line.text()));
                        if (!matcher.matches()) continue;
                        int colon = line.text().indexOf(':');
                        String raw = colon < 0 ? "" : line.text().substring(colon + 1).strip();
                        var value = layout.normalizeShortAnswer(raw);
                        local.add(
                                new Evidence(
                                        question.clientId(),
                                        "SHORT_CONCLUSION",
                                        null,
                                        raw,
                                        value.orElse(null),
                                        lineRange(line)));
                        if (value.isEmpty())
                            issue(
                                    issues,
                                    "SHORT_ANSWER_REVIEW_REQUIRED",
                                    question.clientId(),
                                    "Giá trị trả lời có ký hiệu/đơn vị hoặc bị tách dòng; cần đối"
                                            + " chiếu nguồn",
                                    lineRange(line));
                    }
                }
                evidence.addAll(local);
                var resolved = resolve(group, local, question, issues);
                boolean hasAnswer =
                        resolved.answerType() == AnswerType.SHORT_ANSWER
                                ? resolved.correctAnswerText() != null
                                : !resolved.options().isEmpty()
                                        && resolved.options().stream()
                                                .allMatch(o -> o.isCorrect() != null);
                if (!hasAnswer) {
                    complete = false;
                    issue(
                            issues,
                            "ANSWER_UNRESOLVED",
                            question.clientId(),
                            "Chưa có đáp án rõ ràng, đủ và không mâu thuẫn",
                            block.range());
                }
                if (explanation.isBlank()) {
                    complete = false;
                    issue(
                            issues,
                            "EXPLANATION_EMPTY",
                            question.clientId(),
                            "Lời giải chưa đọc được text; cần kiểm tra ảnh nguồn",
                            explanationSource);
                }
                questions.add(
                        new Question(
                                question.clientId(),
                                question.number(),
                                question.rawText(),
                                question.rawStem(),
                                question.points(),
                                question.source(),
                                resolved,
                                question.textRegions(),
                                explanation.isBlank() ? null : explanation,
                                explanationSource));
            }
            sections.add(
                    new Section(
                            section.clientId(),
                            section.label(),
                            section.rawTitle(),
                            section.rawIntroduction(),
                            section.answerType(),
                            section.expectedFirstQuestion(),
                            section.expectedLastQuestion(),
                            section.source(),
                            List.copyOf(questions)));
        }
        for (var entry : blocks.entrySet())
            if (!used.contains(entry.getKey())) {
                complete = false;
                issue(
                        issues,
                        "SOLUTION_WITHOUT_QUESTION",
                        "sections",
                        "Có lời giải không ghép được vào câu hỏi",
                        entry.getValue().getFirst().range());
            }
        if (sections.isEmpty() || sections.stream().allMatch(s -> s.questions().isEmpty()))
            complete = false;
        issues.add(
                new Issue(
                        "SOLUTION_SOURCE_REVIEW_REQUIRED",
                        "WARNING",
                        "sections",
                        "Đáp án chỉ được đọc từ dấu hiệu nguồn; chưa kiểm chứng tính đúng của lời"
                                + " giải hoặc công thức",
                        original.selection().solutions()));
        return new Result(
                new Structure(
                        original.selection(),
                        List.copyOf(sections),
                        List.copyOf(issues),
                        complete,
                        original.latexChecked(),
                        original.requiresPoints()),
                List.copyOf(evidence));
    }

    private static Map<Key, List<Block>> blocks(
            Index index, Selection selection, List<Issue> issues) {
        var result = new LinkedHashMap<Key, List<Block>>();
        Block block = null;
        String section = null;
        int count = 0;
        for (var line : index.lines(selection.solutions())) {
            var layout = index.layout();
            if (layout.isFooter(line)) continue;
            var part = layout.section().matcher(line.text());
            var question = layout.question().matcher(line.text());
            if (part.matches()) {
                if (block != null) block.end = line.position();
                block = null;
                section = part.group(1).toUpperCase(Locale.ROOT);
            } else if (question.find() && PdfExamStructureParser.questionHeader(line, question)) {
                if (block != null) block.end = line.position();
                if (++count > 500)
                    throw new ScopeException(
                            ErrorCode.PDF_LIMIT_EXCEEDED, "Quá nhiều câu trong vùng lời giải");
                block = new Block(new Key(section, Integer.parseInt(question.group(1))), line);
                result.computeIfAbsent(block.key, k -> new ArrayList<>()).add(block);
                if (layout.uncertainQuestionLabel(question.group())) {
                    block.trusted = false;
                    issue(
                            issues,
                            "SOLUTION_LABEL_UNCERTAIN",
                            "sections",
                            "Nhãn câu lời giải bị mất ký tự; không tự tin ghép",
                            new Range(line.position(), selection.solutions().end()));
                }
                block.lines.add(line);
            } else if (block != null) block.lines.add(line);
        }
        if (block != null) block.end = selection.solutions().end();
        return result;
    }

    private static void choiceEvidence(
            Index index,
            Map<Integer, List<PdfExamHighlightReader.Highlight>> highlightsByPage,
            Block block,
            int body,
            Question question,
            List<Evidence> evidence,
            List<Issue> issues) {
        if (!index.layout().usesAnswerHighlights()) return;
        var choices = new ArrayList<Choice>();
        Choice current = null;
        for (var line : block.lines.subList(0, body)) {
            var matcher = index.layout().choice().matcher(line.text());
            int cursor = 0;
            while (matcher.find()) {
                if (choices.size() >= 50)
                    throw new ScopeException(
                            ErrorCode.PDF_LIMIT_EXCEEDED, "Quá nhiều nhãn đáp án trong lời giải");
                if (current != null) current.slices.add(new Slice(line, cursor, matcher.start()));
                int at = matcher.start();
                var anchor =
                        line.spans().stream()
                                .filter(s -> s.start() <= at && s.end() > at)
                                .findFirst()
                                .map(s -> new Region(line.page(), s.box()))
                                .orElse(null);
                current = new Choice(matcher.group(1), anchor);
                choices.add(current);
                cursor = matcher.end();
            }
            if (current != null) current.slices.add(new Slice(line, cursor, line.text().length()));
        }
        int firstA = -1;
        for (int i = 0; i < choices.size(); i++)
            if (choices.get(i).label.equals("A")) {
                firstA = i;
                break;
            }
        if (firstA > 0
                && choices.subList(firstA, choices.size()).stream()
                        .map(c -> c.label)
                        .toList()
                        .equals(List.of("A", "B", "C", "D")))
            choices = new ArrayList<>(choices.subList(firstA, choices.size()));
        if (!choices.stream().map(c -> c.label).toList().equals(List.of("A", "B", "C", "D"))) {
            issue(
                    issues,
                    "SOLUTION_OPTIONS_UNCERTAIN",
                    question.clientId(),
                    "Nhãn phương án trong lời giải không duy nhất theo A–D: "
                            + choices.stream().map(c -> c.label).toList(),
                    block.range());
            return;
        }
        var firstAnchor = choices.getFirst().anchor;
        boolean sameRow =
                choices.stream()
                        .allMatch(
                                c ->
                                        firstAnchor != null
                                                && c.anchor != null
                                                && c.anchor.page() == firstAnchor.page()
                                                && Math.abs(
                                                                c.anchor.box().top()
                                                                        - firstAnchor.box().top())
                                                        < 12);
        for (int i = 1; sameRow && i < choices.size(); i++)
            sameRow = choices.get(i).anchor.box().left() > choices.get(i - 1).anchor.box().left();
        var allSlices = choices.stream().flatMap(c -> c.slices.stream()).toList();
        var pages =
                allSlices.stream()
                        .map(s -> s.line().page())
                        .collect(java.util.stream.Collectors.toSet());
        var highlights =
                pages.stream()
                        .flatMap(p -> highlightsByPage.getOrDefault(p, List.of()).stream())
                        .toList();
        for (int i = 0; i < choices.size(); i++) {
            var choice = choices.get(i);
            float left = sameRow ? choice.anchor.box().left() : Float.NEGATIVE_INFINITY;
            float right =
                    sameRow && i + 1 < choices.size()
                            ? choices.get(i + 1).anchor.box().left()
                            : Float.POSITIVE_INFINITY;
            var slices = sameRow ? allSlices : choice.slices;
            for (var highlight : highlights) {
                // Formula glyphs can appear after D in extracted order while physically belonging
                // to C.
                // With four aligned labels, use their physical columns, not that unreliable text
                // order.
                boolean overlap =
                        slices.stream()
                                .anyMatch(
                                        s ->
                                                s.line().page() == highlight.page()
                                                        && s.line().spans().stream()
                                                                .anyMatch(
                                                                        span ->
                                                                                span.start()
                                                                                                < s
                                                                                                        .to()
                                                                                        && span
                                                                                                        .end()
                                                                                                > s
                                                                                                        .from()
                                                                                        && covered(
                                                                                                span
                                                                                                        .box(),
                                                                                                highlight
                                                                                                        .box())
                                                                                        && (span.box()
                                                                                                                        .left()
                                                                                                                + span.box()
                                                                                                                        .right())
                                                                                                        / 2
                                                                                                >= left
                                                                                        && (span.box()
                                                                                                                        .left()
                                                                                                                + span.box()
                                                                                                                        .right())
                                                                                                        / 2
                                                                                                < right));
                if (overlap)
                    evidence.add(
                            new Evidence(
                                    question.clientId(),
                                    highlight.kind(),
                                    choice.label,
                                    choice.label,
                                    choice.label,
                                    new Range(
                                            new Position(
                                                    highlight.page(),
                                                    highlight.box().left(),
                                                    highlight.box().top()),
                                            new Position(
                                                    highlight.page(),
                                                    highlight.box().right(),
                                                    highlight.box().bottom()))));
            }
        }
    }

    private static AnswerGroup resolve(
            AnswerGroup group, List<Evidence> evidence, Question question, List<Issue> issues) {
        var values = new LinkedHashMap<String, Set<String>>();
        boolean uncertain = false;
        for (var e : evidence) {
            if (e.value() == null) {
                uncertain = true;
                continue;
            }
            String key = group.answerType() == AnswerType.TRUE_FALSE ? e.label() : "answer";
            values.computeIfAbsent(key, k -> new HashSet<>()).add(e.value());
        }
        boolean conflict = values.values().stream().anyMatch(s -> s.size() > 1);
        if (conflict)
            issue(
                    issues,
                    "ANSWER_CONFLICT",
                    question.clientId(),
                    "Các dấu hiệu đáp án trong nguồn mâu thuẫn",
                    question.source());
        if (conflict || uncertain) return group;
        if (group.answerType() == AnswerType.SHORT_ANSWER) {
            String value =
                    values.containsKey("answer") ? values.get("answer").iterator().next() : null;
            return new AnswerGroup(
                    group.clientId(), group.answerType(), group.points(), value, group.options());
        }
        var labels = group.options().stream().map(Option::label).toList();
        var expected =
                group.answerType() == AnswerType.SINGLE_CHOICE
                        ? List.of("A", "B", "C", "D")
                        : List.of("a", "b", "c", "d");
        if (!labels.equals(expected)) return group;
        String selected =
                values.containsKey("answer") ? values.get("answer").iterator().next() : null;
        var options = new ArrayList<Option>();
        for (var option : group.options()) {
            Boolean correct =
                    group.answerType() == AnswerType.SINGLE_CHOICE
                            ? (selected == null ? null : option.label().equals(selected))
                            : values.containsKey(option.label())
                                    ? Boolean.valueOf(values.get(option.label()).iterator().next())
                                    : null;
            options.add(
                    new Option(
                            option.clientId(),
                            option.label(),
                            option.rawText(),
                            correct,
                            option.points(),
                            option.textRegions()));
        }
        return new AnswerGroup(
                group.clientId(), group.answerType(), group.points(), null, List.copyOf(options));
    }

    private static boolean covered(TextBox text, TextBox mark) {
        double area =
                Math.max(0, text.right() - text.left()) * Math.max(0, text.bottom() - text.top());
        double overlap =
                Math.max(
                                0,
                                Math.min(text.right(), mark.right())
                                        - Math.max(text.left(), mark.left()))
                        * Math.max(
                                0,
                                Math.min(text.bottom(), mark.bottom())
                                        - Math.max(text.top(), mark.top()));
        return area > 0 && overlap / area >= 0.6;
    }

    private static String normalize(String text) {
        return PdfExamLayout.normalize(text).replace('\u00a0', ' ').strip();
    }

    private static Range lineRange(Line line) {
        float bottom =
                (float)
                        line.spans().stream()
                                .mapToDouble(s -> s.box().bottom())
                                .max()
                                .orElse(line.top() + 1);
        return new Range(line.position(), new Position(line.page(), line.width(), bottom));
    }

    private static void issue(
            List<Issue> issues, String code, String path, String message, Range source) {
        issues.add(new Issue(code, "BLOCKING", path, message, source));
    }
}
