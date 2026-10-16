package com.classmanagement.backend.service.exam.pdf;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.IOUtils;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.TextPosition;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.Normalizer;
import java.util.*;

/** Read-only stage one of PDF import. No database, media writes or Spring service. */
public final class PdfExamScopeParser {
    private final long maxBytes;
    private final int maxPages;
    private final int maxCharacters;

    public PdfExamScopeParser() {
        this(10L * 1024 * 1024, 500, 2_000_000);
    }

    public PdfExamScopeParser(long maxBytes, int maxPages, int maxCharacters) {
        if (maxBytes <= 0 || maxPages <= 0 || maxCharacters <= 0)
            throw new IllegalArgumentException("PDF limits must be positive");
        this.maxBytes = maxBytes;
        this.maxPages = maxPages;
        this.maxCharacters = maxCharacters;
    }

    /**
     * Physical page is one-based; x/y are display points from the top-left of the rotated crop box.
     */
    public record Position(int page, float x, float y) {}

    /** End is exclusive. A range can begin/end mid-page. */
    public record Range(Position start, Position end) {}

    public record Selection(
            int examNumber,
            int totalPages,
            List<Integer> availableExamNumbers,
            Range questions,
            Range solutions) {}

    public enum ErrorCode {
        INVALID_PDF,
        PDF_LIMIT_EXCEEDED,
        ENCRYPTED_PDF,
        TEXT_LAYER_REQUIRED,
        EXAM_NOT_FOUND,
        EXAM_NUMBER_AMBIGUOUS,
        SOLUTION_BOUNDARY_MISSING,
        SOLUTION_BOUNDARY_AMBIGUOUS,
        IMPORT_INTERRUPTED
    }

    public static final class ScopeException extends RuntimeException {
        private final ErrorCode code;

        public ScopeException(ErrorCode code, String message) {
            super(message);
            this.code = code;
        }

        public ErrorCode code() {
            return code;
        }
    }

    public record TextBox(float left, float top, float right, float bottom) {}

    public record TextSpan(int start, int end, TextBox box) {}

    public record Line(
            String text,
            int page,
            float left,
            float top,
            float width,
            float height,
            List<TextSpan> spans) {
        public Line {
            spans = List.copyOf(spans);
        }

        Position position() {
            return new Position(page, left, top);
        }
    }

    private record Heading(int number, int line) {}

    /** Immutable text index; reuse it to select a range without reopening the PDF. */
    public static final class Index {
        private final List<Line> lines;
        private final int pages;
        private final float width, height;
        private final PdfExamLayout layout;
        private final List<PdfExamHighlightReader.Highlight> highlights;
        private final String sourceDigest;

        public String sourceDigest() {
            return sourceDigest;
        }

        public PdfExamLayout layout() {
            return layout;
        }

        public List<PdfExamHighlightReader.Highlight> highlights() {
            return highlights;
        }

        private Index(
                List<Line> lines,
                int pages,
                float width,
                float height,
                PdfExamLayout layout,
                List<PdfExamHighlightReader.Highlight> highlights,
                String sourceDigest) {
            this.layout = Objects.requireNonNull(layout);
            this.highlights = List.copyOf(highlights);
            this.sourceDigest = sourceDigest;
            this.lines = List.copyOf(lines);
            this.pages = pages;
            this.width = width;
            this.height = height;
        }

        public Selection select(int number) {
            if (number <= 0) throw new IllegalArgumentException("Chỉ nhận một số đề nguyên dương");
            return choose(lines, number, pages, width, height, layout);
        }

        /**
         * Ordered raw lines in a selected range only; no solution text enters the question parser.
         */
        public List<Line> lines(Range range) {
            return lines.stream()
                    .filter(
                            l ->
                                    compare(l.position(), range.start()) >= 0
                                            && compare(l.position(), range.end()) < 0)
                    .toList();
        }
    }

    private static int compare(Position a, Position b) {
        int page = Integer.compare(a.page(), b.page());
        return page != 0 ? page : Float.compare(a.y(), b.y());
    }

    public Selection select(Path source, int examNumber) {
        if (examNumber <= 0) throw new IllegalArgumentException("Chỉ nhận một số đề nguyên dương");
        return inspect(source).select(examNumber);
    }

    public Index inspect(Path source) {
        return inspect(source, PdfExamLayout.vietnameseThreePart());
    }

    public Index inspect(Path source, PdfExamLayout layout) {
        return inspect(source, layout, null);
    }

    /**
     * Read text once; inspect graphics only on the selected exam's solution pages in the same
     * document.
     */
    public Index inspectForExam(Path source, int examNumber, PdfExamLayout layout) {
        if (examNumber <= 0) throw new IllegalArgumentException("Chỉ nhận một số đề nguyên dương");
        return inspect(source, layout, examNumber);
    }

    private Index inspect(Path source, PdfExamLayout layout, Integer examNumber) {
        Objects.requireNonNull(layout, "layout");
        Objects.requireNonNull(source, "source");
        try {
            long size = Files.size(source);
            if (size <= 0) throw failure(ErrorCode.INVALID_PDF, "PDF rỗng");
            if (size > maxBytes)
                throw failure(ErrorCode.PDF_LIMIT_EXCEEDED, "PDF vượt giới hạn dung lượng");
            String sourceDigest = digest(source, maxBytes);
            try (var document =
                    Loader.loadPDF(source.toFile(), IOUtils.createTempFileOnlyStreamCache())) {
                if (document.isEncrypted())
                    throw failure(ErrorCode.ENCRYPTED_PDF, "Bản đầu chưa hỗ trợ PDF mã hóa");
                if (!document.getCurrentAccessPermission().canExtractContent())
                    throw failure(ErrorCode.INVALID_PDF, "PDF không cho phép đọc nội dung");
                if (document.getNumberOfPages() == 0 || document.getNumberOfPages() > maxPages)
                    throw failure(
                            ErrorCode.PDF_LIMIT_EXCEEDED, "Số trang PDF không nằm trong giới hạn");
                var reader = new LayoutReader(maxCharacters);
                reader.getText(document);
                reader.flush();
                var index =
                        new Index(
                                reader.lines,
                                document.getNumberOfPages(),
                                reader.lastWidth,
                                reader.lastHeight,
                                layout,
                                List.of(),
                                sourceDigest);
                if (examNumber == null) return index;
                var marks =
                        PdfExamHighlightReader.read(
                                document, index.select(examNumber).solutions(), layout);
                return new Index(
                        reader.lines,
                        document.getNumberOfPages(),
                        reader.lastWidth,
                        reader.lastHeight,
                        layout,
                        marks,
                        sourceDigest);
            }
        } catch (org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException e) {
            throw failure(ErrorCode.ENCRYPTED_PDF, "PDF yêu cầu mật khẩu");
        } catch (IOException e) {
            throw failure(ErrorCode.INVALID_PDF, "Không đọc được PDF");
        }
    }

    /** Binds later rendering to the original bytes, not merely matching page numbers. */
    static String digest(Path source, long maxBytes) throws IOException {
        try {
            var digest = java.security.MessageDigest.getInstance("SHA-256");
            try (var input = Files.newInputStream(source)) {
                byte[] buffer = new byte[16_384];
                long count = 0;
                int read;
                while ((read = input.read(buffer)) != -1) {
                    if (Thread.currentThread().isInterrupted())
                        throw failure(ErrorCode.IMPORT_INTERRUPTED, "Đã ngắt đọc PDF");
                    count += read;
                    if (count > maxBytes)
                        throw failure(ErrorCode.PDF_LIMIT_EXCEEDED, "PDF vượt giới hạn dung lượng");
                    digest.update(buffer, 0, read);
                }
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static Selection choose(
            List<Line> lines,
            int number,
            int pages,
            float lastWidth,
            float lastHeight,
            PdfExamLayout layout) {
        if (lines.isEmpty())
            throw failure(
                    ErrorCode.TEXT_LAYER_REQUIRED,
                    "PDF không có lớp chữ đọc được; cần OCR hoặc kiểm tra font");
        List<Heading> headings = new ArrayList<>();
        for (int i = 0; i < lines.size(); i++) {
            var matcher = layout.examTitle().matcher(normalize(lines.get(i).text()));
            if (!matcher.matches()) continue;
            int value = Integer.parseInt(matcher.group(1));
            if (value <= 0) continue;
            // A real exam title must introduce part I, not a prose reference or table-of-contents
            // entry.
            boolean partOne = false;
            for (int j = i + 1;
                    j
                            < Math.min(
                                    lines.size(),
                                    i + 1 + Math.clamp(layout.headingLookaheadLines(), 1, 100));
                    j++) {
                String next = normalize(lines.get(j).text());
                if (layout.firstSection().matcher(next).matches()) {
                    partOne = true;
                    break;
                }
                if (layout.examTitle().matcher(next).matches()
                        || layout.solutionHeading().matcher(next).matches()
                        || layout.question().matcher(lines.get(j).text()).lookingAt()) break;
            }
            if (partOne) headings.add(new Heading(value, i));
        }
        var matches = headings.stream().filter(h -> h.number() == number).toList();
        if (matches.isEmpty())
            throw failure(
                    ErrorCode.EXAM_NOT_FOUND,
                    "Không tìm thấy tiêu đề đề " + number + " có ngữ cảnh hợp lệ");
        if (matches.size() != 1)
            throw failure(
                    ErrorCode.EXAM_NUMBER_AMBIGUOUS,
                    "Có nhiều vùng mang số đề " + number + ", cần kiểm tra nguồn");
        var selected = matches.getFirst();
        int end =
                headings.stream()
                        .filter(h -> h.line() > selected.line())
                        .mapToInt(Heading::line)
                        .min()
                        .orElse(lines.size());
        List<Integer> solutions = new ArrayList<>();
        for (int i = selected.line() + 1; i < end; i++)
            if (layout.solutionHeading().matcher(normalize(lines.get(i).text())).matches())
                solutions.add(i);
        if (solutions.isEmpty())
            throw failure(
                    ErrorCode.SOLUTION_BOUNDARY_MISSING,
                    "Không tìm thấy hướng dẫn giải riêng của đề " + number);
        if (solutions.size() != 1)
            throw failure(
                    ErrorCode.SOLUTION_BOUNDARY_AMBIGUOUS,
                    "Có nhiều mốc hướng dẫn giải trong đề " + number);
        Position start = lines.get(selected.line()).position(),
                solution = lines.get(solutions.getFirst()).position();
        Position stop =
                end == lines.size()
                        ? new Position(pages, lastWidth, lastHeight)
                        : lines.get(end).position();
        return new Selection(
                number,
                pages,
                headings.stream().map(Heading::number).distinct().sorted().toList(),
                new Range(start, solution),
                new Range(solution, stop));
    }

    private static String normalize(String text) {
        return Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .replace('\u00a0', ' ')
                .replaceAll("\\s+", " ")
                .trim()
                .toUpperCase(Locale.ROOT);
    }

    private static ScopeException failure(ErrorCode code, String message) {
        return new ScopeException(code, message);
    }

    private static final class LayoutReader extends PDFTextStripper {
        private final int limit;
        private int characters;
        private final List<Line> lines = new ArrayList<>();
        private final StringBuilder text = new StringBuilder();
        private final List<TextSpan> spans = new ArrayList<>();
        private float left = Float.MAX_VALUE, top = Float.MAX_VALUE, lastWidth, lastHeight;

        LayoutReader(int limit) throws IOException {
            this.limit = limit;
            setSortByPosition(true);
        }

        @Override
        protected void startPage(PDPage page) throws IOException {
            if (Thread.currentThread().isInterrupted())
                throw failure(ErrorCode.IMPORT_INTERRUPTED, "Tác vụ đọc PDF đã bị ngắt");
            int rotation = Math.floorMod(page.getRotation(), 360);
            lastWidth =
                    rotation == 90 || rotation == 270
                            ? page.getCropBox().getHeight()
                            : page.getCropBox().getWidth();
            lastHeight =
                    rotation == 90 || rotation == 270
                            ? page.getCropBox().getWidth()
                            : page.getCropBox().getHeight();
            super.startPage(page);
        }

        @Override
        protected void writeString(String value, List<TextPosition> positions) {
            characters += value.length();
            if (characters > limit)
                throw failure(ErrorCode.PDF_LIMIT_EXCEEDED, "Lớp chữ PDF vượt giới hạn xử lý");
            int base = text.length(), cursor = 0;
            text.append(value);
            for (var p : positions) {
                float x = p.getXDirAdj(), y = p.getYDirAdj() - p.getHeightDir();
                left = Math.min(left, x);
                top = Math.min(top, y);
                String unicode = p.getUnicode();
                if (unicode == null || unicode.isEmpty()) continue;
                int at = value.indexOf(unicode, cursor);
                if (at >= 0) {
                    spans.add(
                            new TextSpan(
                                    base + at,
                                    base + at + unicode.length(),
                                    new TextBox(
                                            x,
                                            Math.max(0, y),
                                            x + p.getWidthDirAdj(),
                                            p.getYDirAdj())));
                    cursor = at + unicode.length();
                }
            }
        }

        @Override
        protected void writeWordSeparator() {
            text.append(' ');
        }

        @Override
        protected void writeLineSeparator() {
            flush();
        }

        @Override
        protected void endPage(PDPage page) throws IOException {
            flush();
            super.endPage(page);
        }

        private void flush() {
            if (!text.toString().isBlank())
                lines.add(
                        new Line(
                                text.toString(),
                                getCurrentPageNo(),
                                left == Float.MAX_VALUE ? 0 : left,
                                top == Float.MAX_VALUE ? 0 : Math.max(0, top),
                                lastWidth,
                                lastHeight,
                                spans));
            text.setLength(0);
            spans.clear();
            left = top = Float.MAX_VALUE;
        }
    }
}
