package com.classmanagement.backend.service.exam.pdf;

import com.classmanagement.backend.entity.enums.AnswerType;

import java.util.regex.Pattern;

/**
 * Layout-specific recognition only. Shared extraction, provenance and preview stay in the parsers.
 * Patterns for headings operate on normalized text; structure patterns operate on raw text.
 * Capturing group 1 must contain the exam/section/question number or option label.
 */
public interface PdfExamLayout {
    String id();

    Pattern examTitle();

    default int headingLookaheadLines() {
        return 8;
    }

    default boolean uncertainQuestionLabel(String label) {
        return false;
    }

    Pattern firstSection();

    Pattern solutionHeading();

    Pattern section();

    Pattern question();

    Pattern splitQuestion();

    Pattern choice();

    Pattern booleanOption();

    Pattern expectedQuestions();

    AnswerType answerType(String introduction);

    boolean isFooter(PdfExamScopeParser.Line line);

    /** No default answer syntax: another layout must opt in to its own explicit conclusions. */
    default Pattern explanationHeading() {
        return Pattern.compile("(?!)");
    }

    default Pattern choiceConclusion() {
        return Pattern.compile("(?!)");
    }

    default Pattern booleanConclusion() {
        return Pattern.compile("(?!)");
    }

    default java.util.Optional<Boolean> booleanValue(String token) {
        return java.util.Optional.empty();
    }

    default Pattern shortConclusion() {
        return Pattern.compile("(?!)");
    }

    default boolean usesAnswerHighlights() {
        return false;
    }

    default java.util.Optional<String> highlightKind(int rgb) {
        return java.util.Optional.empty();
    }

    default java.util.Optional<String> normalizeShortAnswer(String raw) {
        return java.util.Optional.empty();
    }

    static PdfExamLayout vietnameseThreePart() {
        return new VietnameseThreePart();
    }

    class VietnameseThreePart implements PdfExamLayout {
        public static final int FLAGS = Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE;
        public static final Pattern SECTION =
                Pattern.compile("^\\s*PH(?:Ầ|A)N\\s+([IVXLCDM]+|\\d+)\\s*[.:].*", FLAGS);
        public static final Pattern QUESTION =
                Pattern.compile("C(?:Â|A)U?\\s*(\\d{1,4})\\s*[:.]\\s*", FLAGS);
        public static final Pattern SPLIT_QUESTION =
                Pattern.compile("^\\s*C(?:Â|A)U\\s*(\\d{1,4})\\s+(?=\\p{L})", FLAGS);
        public static final Pattern CHOICE =
                Pattern.compile("(?<![\\p{L}\\p{N}])([A-D])[ \\t\\u00a0]*\\.");
        public static final Pattern BOOLEAN = Pattern.compile("(?<![\\p{L}\\p{N}(])([a-d])\\)");
        public static final Pattern EXPECTED =
                Pattern.compile("TU\\s+CAU\\s*(\\d+)\\s+DEN\\s+(?:CAU\\s*)?(\\d+)");

        public boolean uncertainQuestionLabel(String label) {
            return !normalize(label).startsWith("CAU");
        }

        public String id() {
            return "vi-three-part-v1";
        }

        public boolean usesAnswerHighlights() {
            return true;
        }

        public java.util.Optional<String> highlightKind(int rgb) {
            int red = (rgb >> 16) & 255, green = (rgb >> 8) & 255, blue = rgb & 255;
            if (red >= 210 && green >= 190 && blue <= 110)
                return java.util.Optional.of("YELLOW_FILL");
            if (red <= 80 && green >= 210 && blue <= 80) return java.util.Optional.of("GREEN_FILL");
            return java.util.Optional.empty();
        }

        public java.util.Optional<String> normalizeShortAnswer(String raw) {
            String value = raw.strip().replace('\u2212', '-');
            return value.matches("[+-]?\\d+(?:[.,]\\d+)?")
                    ? java.util.Optional.of(value)
                    : java.util.Optional.empty();
        }

        public Pattern explanationHeading() {
            return Pattern.compile("^LOI GIAI\\s*[:.]?$");
        }

        public Pattern choiceConclusion() {
            return Pattern.compile("^(?:CHON|DAP AN\\s*:)\\s*([A-D])\\s*[.]?$");
        }

        public Pattern booleanConclusion() {
            return Pattern.compile("([a-d])\\)\\s*(DUNG|SAI)\\s*[.:;]?", Pattern.CASE_INSENSITIVE);
        }

        public java.util.Optional<Boolean> booleanValue(String token) {
            return switch (normalize(token)) {
                case "DUNG" -> java.util.Optional.of(true);
                case "SAI" -> java.util.Optional.of(false);
                default -> java.util.Optional.empty();
            };
        }

        public Pattern shortConclusion() {
            return Pattern.compile("^(?:TRA LOI|DAP AN)\\s*:\\s*(.*?)\\s*$");
        }

        public Pattern examTitle() {
            return Pattern.compile(
                    "^(?:MON\\s*:.*?[-–—]\\s*)?DE\\s*(?:SO\\s*)?[:.\\-–—]?\\s*0*(\\d{1,6})\\s*$");
        }

        public Pattern firstSection() {
            return Pattern.compile("^PHAN\\s+(?:I|1)\\s*[.:].*");
        }

        public Pattern solutionHeading() {
            return Pattern.compile("^HUONG DAN GIAI CHI TIET\\s*[:.]?$");
        }

        public Pattern section() {
            return SECTION;
        }

        public Pattern question() {
            return QUESTION;
        }

        public Pattern splitQuestion() {
            return SPLIT_QUESTION;
        }

        public Pattern choice() {
            return CHOICE;
        }

        public Pattern booleanOption() {
            return BOOLEAN;
        }

        public Pattern expectedQuestions() {
            return EXPECTED;
        }

        public AnswerType answerType(String text) {
            String value = normalize(text).replaceAll("[\\s–—/]+", " ");
            if (value.contains("DUNG SAI") || value.contains("DUNG/SAI"))
                return AnswerType.TRUE_FALSE;
            if (value.contains("TRA LOI NGAN")) return AnswerType.SHORT_ANSWER;
            if (value.contains("NHIEU PHUONG AN LUA CHON") || value.contains("MOT PHUONG AN"))
                return AnswerType.SINGLE_CHOICE;
            return null;
        }

        public boolean isFooter(PdfExamScopeParser.Line line) {
            String value = normalize(line.text()).trim();
            return line.top() > line.height() * 0.88
                    && (value.matches("PAGE\\s*\\d+")
                            || value.equals("SUU TAM VA BIEN SOAN")
                            || value.matches("[-\\s]*HET[-\\s]*"));
        }
    }

    static String normalize(String text) {
        return java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .toUpperCase(java.util.Locale.ROOT);
    }
}
