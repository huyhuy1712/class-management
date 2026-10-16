package com.classmanagement.backend.service.exam.pdf;

import com.classmanagement.backend.dto.exam.CreateCompleteExamRequest;
import com.classmanagement.backend.dto.exam.CreateCompleteExamRequest.*;
import com.classmanagement.backend.service.exam.pdf.PdfExamImportService.Review;
import com.classmanagement.backend.service.exam.pdf.PdfExamMediaExtractor.Owner;
import com.classmanagement.backend.service.exam.pdf.PdfExamMediaExtractor.Purpose;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

/** Pure mapping of explicitly reviewed illustrations; source reference screenshots stay private. */
final class PdfExamReviewMapper {
    private static final Pattern INLINE_MATH = Pattern.compile("\\$([^$]+)\\$");

    private record Target(int section, int question, int answer, int option, Owner owner) {}

    private final CreateCompleteExamRequest request;
    private final Map<UUID, Target> targets = new HashMap<>();

    PdfExamReviewMapper(Review preview, CreateCompleteExamRequest request) {
        this.request = request;
        if (request.importReview() == null
                || !Boolean.TRUE.equals(request.importReview().sourceReviewed())) {
            throw new IllegalArgumentException("Cần xác nhận đã đối chiếu câu, đáp án, ảnh và công thức với nguồn");
        }
        var chosen = request.importReview().illustrationAssetIds();
        if (chosen == null || chosen.size() > 150 || new HashSet<>(chosen).size() != chosen.size()) {
            throw new IllegalArgumentException("Danh sách ảnh minh họa không hợp lệ hoặc bị trùng");
        }
        if (chosen.isEmpty()) {
            if (request.importReview().illustrationTargets() != null
                    && !request.importReview().illustrationTargets().isEmpty()) {
                throw new IllegalArgumentException("Có vị trí ảnh nhưng chưa chọn ảnh nguồn");
            }
            return;
        }
        var explicit = request.importReview().illustrationTargets();
        var locations = explicit == null ? locations(preview) : Map.<String, Target>of();
        var destinations = new HashMap<UUID, IllustrationTarget>();
        if (explicit != null) {
            for (var destination : explicit) {
                if (destinations.putIfAbsent(destination.assetId(), destination) != null) {
                    throw new IllegalArgumentException("Vị trí ảnh bị trùng");
                }
            }
            if (!destinations.keySet().equals(new HashSet<>(chosen))) {
                throw new IllegalArgumentException("Phải chỉ rõ vị trí cho toàn bộ ảnh đã chọn");
            }
        }
        var available = new HashMap<UUID, PdfExamImportService.Media>();
        preview.media().forEach(asset -> available.put(asset.id(), asset));
        var usedTargets = new HashSet<Target>();
        for (UUID id : chosen) {
            var asset = available.get(id);
            if (asset == null || asset.purpose() != Purpose.ILLUSTRATION) {
                throw new IllegalArgumentException("Chỉ chọn ảnh ILLUSTRATION; không gắn SOURCE_REFERENCE vào đề");
            }
            var target = explicit == null ? locations.get(asset.owner() + ":" + asset.ownerId())
                    : destination(destinations.get(id), asset.owner());
            if (target == null || !usedTargets.add(target)) {
                throw new IllegalArgumentException("Ảnh không có vị trí gắn duy nhất trong nội dung đã sửa");
            }
            targets.put(id, target);
        }
    }

    private Target destination(IllustrationTarget selected, Owner owner) {
        int si = selected.sectionIndex();
        int qi = selected.questionIndex();
        if (si < 0 || si >= request.sections().size()
                || qi < 0 || qi >= request.sections().get(si).questions().size()) throw invalidTarget();
        if (owner != Owner.OPTION) {
            if (selected.answerIndex() != null || selected.optionIndex() != null) throw invalidTarget();
            return new Target(si, qi, -1, -1, owner);
        }
        var answers = request.sections().get(si).questions().get(qi).answers();
        var ai = selected.answerIndex();
        var oi = selected.optionIndex();
        if (ai == null || oi == null || ai < 0 || ai >= answers.size()) throw invalidTarget();
        var options = answers.get(ai).options();
        if (options == null || oi < 0 || oi >= options.size()) throw invalidTarget();
        return new Target(si, qi, ai, oi, owner);
    }

    private IllegalArgumentException invalidTarget() {
        return new IllegalArgumentException("Vị trí gắn ảnh không tồn tại hoặc không đúng loại ảnh nguồn");
    }

    private Map<String, Target> locations(Review preview) {
        var result = new HashMap<String, Target>();
        var original = preview.structure().sections();
        if (original.size() != request.sections().size()) throw changedStructure();
        for (int si = 0; si < original.size(); si++) {
            var source = original.get(si).questions();
            var edited = request.sections().get(si).questions();
            if (source.size() != edited.size()) throw changedStructure();
            for (int qi = 0; qi < source.size(); qi++) {
                var from = source.get(qi);
                var to = edited.get(qi);
                if (to.answers().size() != 1
                        || to.answers().getFirst().answerType() != from.group().answerType()) {
                    throw changedStructure();
                }
                result.put(Owner.QUESTION + ":" + from.clientId(), new Target(si, qi, -1, -1, Owner.QUESTION));
                result.put(Owner.EXPLANATION + ":" + from.clientId(), new Target(si, qi, -1, -1, Owner.EXPLANATION));
                var options = from.group().options();
                var editedOptions = to.answers().getFirst().options();
                if (options.size() != (editedOptions == null ? 0 : editedOptions.size())) throw changedStructure();
                for (int oi = 0; oi < options.size(); oi++) {
                    result.put(Owner.OPTION + ":" + options.get(oi).clientId(), new Target(si, qi, 0, oi, Owner.OPTION));
                }
            }
        }
        return result;
    }

    private IllegalArgumentException changedStructure() {
        return new IllegalArgumentException(
                "Cấu trúc đã đổi; cần gửi illustrationTargets để chỉ rõ vị trí ảnh trong nội dung đã sửa");
    }

    CreateCompleteExamRequest attach(Map<UUID, UUID> uploaded) {
        if (!uploaded.keySet().equals(targets.keySet())) {
            throw new IllegalArgumentException("Lô ảnh chuyển đổi chưa đầy đủ");
        }
        if (targets.isEmpty()) {
            return new CreateCompleteExamRequest(request.basicInfo(), request.assignment(),
                    request.draftToken(), request.sections());
        }
        var media = new HashMap<Target, UUID>();
        uploaded.forEach((id, value) -> media.put(targets.get(id), value));
        var sections = new ArrayList<Section>();
        for (int si = 0; si < request.sections().size(); si++) {
            var section = request.sections().get(si);
            var questions = new ArrayList<Question>();
            for (int qi = 0; qi < section.questions().size(); qi++) {
                var question = section.questions().get(qi);
                var answers = new ArrayList<Answer>();
                for (int ai = 0; ai < question.answers().size(); ai++) {
                    var answer = question.answers().get(ai);
                    List<Option> options = null;
                    if (answer.options() != null) {
                        options = new ArrayList<>();
                        for (int oi = 0; oi < answer.options().size(); oi++) {
                            var option = answer.options().get(oi);
                            UUID image = image(media, new Target(si, qi, ai, oi, Owner.OPTION), option.imageMediaId());
                            options.add(new Option(option.content(), image, option.audioMediaId(),
                                    option.isCorrect(), option.points()));
                        }
                    }
                    answers.add(new Answer(answer.answerType(), answer.content(), answer.imageMediaId(),
                            answer.audioMediaId(), answer.points(), answer.scoringType(), answer.correctAnswerText(),
                            answer.caseSensitive(), options, answer.scoringRules()));
                }
                UUID image = image(media, new Target(si, qi, -1, -1, Owner.QUESTION), question.imageMediaId());
                UUID explanationImage = image(media, new Target(si, qi, -1, -1, Owner.EXPLANATION),
                        question.explanationImageMediaId());
                questions.add(new Question(question.content(), question.explanation(), image,
                        question.audioMediaId(), question.points(), List.copyOf(answers),
                        explanationImage, question.explanationAudioMediaId()));
            }
            sections.add(new Section(section.title(), section.paragraph(), section.imageMediaId(),
                    section.audioMediaId(), List.copyOf(questions)));
        }
        // This reviewed payload enters the existing persistence API; review metadata is kept on the job.
        return new CreateCompleteExamRequest(request.basicInfo(), request.assignment(), request.draftToken(),
                List.copyOf(sections));
    }

    private UUID image(Map<Target, UUID> media, Target target, UUID existing) {
        UUID selected = media.get(target);
        if (selected != null && existing != null) {
            throw new IllegalArgumentException("Một vị trí ảnh đã có media khác; bỏ chọn ảnh nguồn hoặc xóa media đó");
        }
        return selected == null ? existing : selected;
    }

    /** Match the current FE's $...$ math representation and check the actual payload being saved. */
    static List<String> formulas(CreateCompleteExamRequest request) {
        var result = new ArrayList<String>();
        for (var section : request.sections()) {
            collect(section.paragraph(), result);
            for (var question : section.questions()) {
                collect(question.content(), result);
                collect(question.explanation(), result);
                for (var answer : question.answers()) {
                    collect(answer.content(), result);
                    // correctAnswerText is a grading value, not MathRenderer content.
                    if (answer.options() != null) {
                        answer.options().forEach(option -> collect(option.content(), result));
                    }
                }
            }
        }
        return List.copyOf(result);
    }

    private static void collect(String text, List<String> result) {
        if (text == null) return;
        var matcher = INLINE_MATH.matcher(text);
        int previous = 0;
        while (matcher.find()) {
            if (text.substring(previous, matcher.start()).contains("$")) throw invalidMath();
            String latex = matcher.group(1);
            if (latex.isBlank() || latex.length() > 4096 || result.size() >= 1000) throw invalidMath();
            result.add(latex);
            previous = matcher.end();
        }
        if (text.substring(previous).contains("$")) throw invalidMath();
    }

    private static IllegalArgumentException invalidMath() {
        return new IllegalArgumentException("Công thức phải nằm trong $...$, đủ dấu đóng và không vượt giới hạn");
    }
}
