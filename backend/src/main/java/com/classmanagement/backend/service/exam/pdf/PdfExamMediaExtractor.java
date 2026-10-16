package com.classmanagement.backend.service.exam.pdf;

import static com.classmanagement.backend.service.exam.pdf.PdfExamScopeParser.*;
import static com.classmanagement.backend.service.exam.pdf.PdfExamStructureParser.*;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.contentstream.PDFGraphicsStreamEngine;
import org.apache.pdfbox.contentstream.operator.Operator;
import org.apache.pdfbox.cos.*;
import org.apache.pdfbox.io.IOUtils;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.graphics.image.PDImage;
import org.apache.pdfbox.rendering.*;

import java.awt.Color;
import java.awt.geom.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.Path;
import java.util.*;

import javax.imageio.ImageIO;

/**
 * Stage four: bounded private preview assets. No database, public URLs, or automatic media claims.
 */
public final class PdfExamMediaExtractor {
    public enum Owner {
        QUESTION,
        OPTION,
        EXPLANATION
    }

    public enum Purpose {
        SOURCE_REFERENCE,
        ILLUSTRATION
    }

    public record Limits(
            int dpi,
            long maxPagePixels,
            long maxAssetPixels,
            long maxTotalPixels,
            int maxDimension,
            int maxAssets,
            long maxPngBytes,
            long maxTotalBytes) {
        public Limits {
            if (dpi < 36
                    || dpi > 200
                    || maxPagePixels <= 0
                    || maxAssetPixels <= 0
                    || maxTotalPixels <= 0
                    || maxDimension <= 0
                    || maxAssets <= 0
                    || maxPngBytes <= 0
                    || maxTotalBytes <= 0)
                throw new IllegalArgumentException("Giới hạn ảnh PDF không hợp lệ");
        }

        public static Limits defaults() {
            return new Limits(
                    120,
                    8_000_000,
                    16_000_000,
                    32_000_000,
                    8192,
                    150,
                    5 * 1024 * 1024,
                    32 * 1024 * 1024);
        }
    }

    /**
     * Always teacher-only until reviewed. Source references must never be attached as student
     * content.
     */
    /** Maps a piece of the composite PNG back to one physical PDF page. Gaps are not source. */
    public record SourceSlice(Region source, int top, int width, int height) {}

    public record Asset(
            String ownerId,
            Owner owner,
            Purpose purpose,
            List<Region> sources,
            int width,
            int height,
            byte[] png,
            boolean teacherOnly,
            boolean requiresReview,
            List<SourceSlice> slices) {
        public Asset {
            sources = List.copyOf(sources);
            slices = List.copyOf(slices);
            png = png.clone();
        }

        @Override
        public byte[] png() {
            return png.clone();
        }
    }

    public record Result(List<Asset> assets, List<Issue> issues, int renderedPages) {
        public Result {
            assets = List.copyOf(assets);
            issues = List.copyOf(issues);
        }
    }

    private record Key(String id, Owner owner, Purpose purpose) {}

    private record Crop(Region region, BufferedImage image) {}

    private record Graphic(TextBox box, boolean image) {}

    private static final class Plan {
        final Key key;
        final Range scope;
        final List<Region> regions = new ArrayList<>();
        final List<Crop> crops = new ArrayList<>();
        boolean failed;

        Plan(Key key, Range scope) {
            this.key = key;
            this.scope = scope;
        }
    }

    private final Limits limits;

    public PdfExamMediaExtractor() {
        this(Limits.defaults());
    }

    public PdfExamMediaExtractor(Limits limits) {
        this.limits = Objects.requireNonNull(limits);
    }

    public Result extract(Path source, Index index, Structure structure) {
        Objects.requireNonNull(source);
        Objects.requireNonNull(index);
        Objects.requireNonNull(structure);
        if (!index.select(structure.selection().examNumber()).equals(structure.selection()))
            throw new IllegalArgumentException("Phạm vi đề không khớp chỉ mục");
        var issues = new ArrayList<Issue>();
        var plans = new LinkedHashMap<Key, Plan>();
        try {
            if (!index.sourceDigest().equals(PdfExamScopeParser.digest(source, 10L * 1024 * 1024)))
                throw new IllegalArgumentException(
                        "PDF đã thay đổi sau khi đọc chỉ mục; cần import lại");
            try (var document =
                    Loader.loadPDF(source.toFile(), IOUtils.createTempFileOnlyStreamCache())) {
                if (document.isEncrypted()
                        || document.getNumberOfPages() != structure.selection().totalPages())
                    throw new IllegalArgumentException("PDF không khớp chỉ mục hoặc đang mã hóa");
                var questions =
                        structure.sections().stream().flatMap(s -> s.questions().stream()).toList();
                for (var question : questions) {
                    addReference(
                            plans,
                            document,
                            question.clientId(),
                            Owner.QUESTION,
                            question.source(),
                            structure.selection().questions());
                    if (question.explanationSource() != null)
                        addReference(
                                plans,
                                document,
                                question.clientId(),
                                Owner.EXPLANATION,
                                question.explanationSource(),
                                structure.selection().solutions());
                }
                var pages = new TreeSet<Integer>();
                plans.values().forEach(p -> p.regions.forEach(r -> pages.add(r.page())));
                long retainedPixels = 0;
                int rendered = 0;
                var renderer = new PDFRenderer(document);
                // Annotations can contain arbitrary teacher notes, including answers.
                renderer.setAnnotationsFilter(annotation -> false);
                for (int page : pages) {
                    interrupted();
                    var pdfPage = document.getPage(page - 1);
                    if (Math.floorMod(pdfPage.getRotation(), 360) != 0) {
                        failPage(
                                plans,
                                issues,
                                page,
                                "MEDIA_ROTATION_UNSUPPORTED",
                                "Trang xoay cần bộ chuyển tọa độ riêng");
                        continue;
                    }
                    var box = pdfPage.getCropBox();
                    double scale = limits.dpi() / 72d;
                    long width = (long) Math.ceil(box.getWidth() * scale),
                            height = (long) Math.ceil(box.getHeight() * scale);
                    if (width <= 0
                            || height <= 0
                            || width > limits.maxDimension()
                            || height > limits.maxDimension()
                            || width > limits.maxPagePixels() / height) {
                        failPage(
                                plans,
                                issues,
                                page,
                                "MEDIA_PAGE_LIMIT",
                                "Trang vượt giới hạn kích thước render");
                        continue;
                    }
                    List<Graphic> graphics;
                    try {
                        var reader = new GraphicsReader(pdfPage, limits.maxAssetPixels());
                        reader.processPage(pdfPage);
                        graphics = reader.graphics;
                    } catch (ScopeException e) {
                        if (e.code() == ErrorCode.IMPORT_INTERRUPTED) throw e;
                        failPage(plans, issues, page, "MEDIA_GRAPHICS_LIMIT", e.getMessage());
                        continue;
                    }
                    discover(plans, graphics, questions, page, issues);
                    BufferedImage image =
                            renderer.renderImageWithDPI(page - 1, limits.dpi(), ImageType.RGB);
                    rendered++;
                    try {
                        for (var plan : plans.values()) {
                            if (plan.failed) continue;
                            for (var region : plan.regions)
                                if (region.page() == page) {
                                    var b = region.box();
                                    int x = Math.max(0, (int) Math.ceil(b.left() * scale)),
                                            y = Math.max(0, (int) Math.ceil(b.top() * scale));
                                    int right =
                                            Math.min(
                                                    image.getWidth(),
                                                    (int) Math.floor(b.right() * scale));
                                    int bottom =
                                            Math.min(
                                                    image.getHeight(),
                                                    (int) Math.floor(b.bottom() * scale));
                                    long pixels = (long) (right - x) * (bottom - y);
                                    if (right <= x
                                            || bottom <= y
                                            || pixels > limits.maxAssetPixels()
                                            || retainedPixels + pixels > limits.maxTotalPixels()) {
                                        plan.failed = true;
                                        issue(
                                                issues,
                                                "MEDIA_CROP_LIMIT",
                                                plan,
                                                "Vùng ảnh vượt giới hạn hoặc không đủ kích thước");
                                        break;
                                    }
                                    var crop =
                                            new BufferedImage(
                                                    right - x,
                                                    bottom - y,
                                                    BufferedImage.TYPE_INT_RGB);
                                    var g = crop.createGraphics();
                                    try {
                                        g.drawImage(
                                                image,
                                                0,
                                                0,
                                                crop.getWidth(),
                                                crop.getHeight(),
                                                x,
                                                y,
                                                right,
                                                bottom,
                                                null);
                                    } finally {
                                        g.dispose();
                                    }
                                    var actualRegion = new Region(page, new TextBox(
                                            (float) (x / scale), (float) (y / scale),
                                            (float) (right / scale), (float) (bottom / scale)));
                                    plan.crops.add(new Crop(actualRegion, crop));
                                    retainedPixels += pixels;
                                }
                        }
                    } finally {
                        image.flush();
                    }
                }
                var assets = new ArrayList<Asset>();
                long totalBytes = 0;
                for (var plan : plans.values()) {
                    try {
                        interrupted();
                        if (plan.failed || plan.crops.isEmpty()) continue;
                        if (plan.crops.size() != plan.regions.size()) {
                            issue(
                                    issues,
                                    "MEDIA_INCOMPLETE",
                                    plan,
                                    "Vùng ảnh chưa được render đầy đủ");
                            continue;
                        }
                        plan.crops.sort(
                                Comparator.comparingInt((Crop c) -> c.region().page())
                                        .thenComparingDouble(c -> c.region().box().top())
                                        .thenComparingDouble(c -> c.region().box().left()));
                        int width =
                                plan.crops.stream()
                                        .mapToInt(c -> c.image().getWidth())
                                        .max()
                                        .orElseThrow();
                        long height =
                                plan.crops.stream().mapToLong(c -> c.image().getHeight()).sum()
                                        + 8L * (plan.crops.size() - 1);
                        if (height > limits.maxDimension()
                                || width > limits.maxDimension()
                                || width * height > limits.maxAssetPixels()) {
                            issue(
                                    issues,
                                    "MEDIA_COMPOSITE_LIMIT",
                                    plan,
                                    "Ảnh ghép quá dài/lớn; cần giáo viên chọn lại vùng");
                            continue;
                        }
                        if (assets.size() >= limits.maxAssets()) {
                            issue(issues, "MEDIA_ASSET_LIMIT", plan, "Quá nhiều ảnh trong một đề");
                            continue;
                        }
                        var composite =
                                new BufferedImage(width, (int) height, BufferedImage.TYPE_INT_RGB);
                        var g = composite.createGraphics();
                        try {
                            g.setColor(Color.WHITE);
                            g.fillRect(0, 0, width, (int) height);
                            int y = 0;
                            for (var crop : plan.crops) {
                                g.drawImage(crop.image(), 0, y, null);
                                y += crop.image().getHeight() + 8;
                            }
                        } finally {
                            g.dispose();
                        }
                        byte[] bytes;
                        try (var output = new BoundedOutput(limits.maxPngBytes())) {
                            if (!ImageIO.write(composite, "png", output))
                                throw new IOException("PNG encoder unavailable");
                            bytes = output.toByteArray();
                        } catch (IOException | ImageLimitException e) {
                            issue(
                                    issues,
                                    "MEDIA_ENCODING_LIMIT",
                                    plan,
                                    "Ảnh không mã hóa được trong giới hạn PNG");
                            continue;
                        } finally {
                            composite.flush();
                        }
                        if (totalBytes + bytes.length > limits.maxTotalBytes()) {
                            issue(
                                    issues,
                                    "MEDIA_TOTAL_BYTES_LIMIT",
                                    plan,
                                    "Tổng dung lượng ảnh vượt giới hạn");
                            continue;
                        }
                        totalBytes += bytes.length;
                        var slices = new ArrayList<SourceSlice>();
                        int sliceTop = 0;
                        for (var crop : plan.crops) {
                            slices.add(new SourceSlice(crop.region(), sliceTop,
                                    crop.image().getWidth(), crop.image().getHeight()));
                            sliceTop += crop.image().getHeight() + 8;
                        }
                        assets.add(
                                new Asset(
                                        plan.key.id(),
                                        plan.key.owner(),
                                        plan.key.purpose(),
                                        plan.crops.stream().map(Crop::region).toList(),
                                        width,
                                        (int) height,
                                        bytes,
                                        true,
                                        true,
                                        slices));
                    } finally {
                        plan.crops.forEach(c -> c.image().flush());
                    }
                }
                return new Result(assets, issues, rendered);
            } finally {
                plans.values().forEach(p -> p.crops.forEach(c -> c.image().flush()));
            }
        } catch (IOException e) {
            throw new ScopeException(ErrorCode.INVALID_PDF, "Không đọc/render được ảnh PDF");
        }
    }

    private static void addReference(
            Map<Key, Plan> plans,
            PDDocument document,
            String id,
            Owner owner,
            Range range,
            Range allowed) {
        if (!contains(allowed, range))
            throw new IllegalArgumentException("Vùng ảnh vượt phạm vi câu hỏi/lời giải được phép");
        var plan = new Plan(new Key(id, owner, Purpose.SOURCE_REFERENCE), range);
        plan.regions.addAll(regions(document, range));
        plans.put(plan.key, plan);
    }

    private static List<Region> regions(PDDocument document, Range range) {
        var result = new ArrayList<Region>();
        for (int page = range.start().page(); page <= range.end().page(); page++) {
            var box = document.getPage(page - 1).getCropBox();
            float top = page == range.start().page() ? range.start().y() : 0,
                    bottom = page == range.end().page() ? range.end().y() : box.getHeight();
            if (top < 0 || bottom > box.getHeight() || bottom < top)
                throw new IllegalArgumentException("Tọa độ vùng ảnh không hợp lệ");
            if (bottom > top)
                result.add(new Region(page, new TextBox(0, top, box.getWidth(), bottom)));
        }
        return result;
    }

    private static boolean contains(Range outer, Range inner) {
        return compare(inner.start(), outer.start()) >= 0
                && compare(inner.end(), outer.end()) <= 0
                && compare(inner.start(), inner.end()) < 0;
    }

    private static int compare(Position a, Position b) {
        int page = Integer.compare(a.page(), b.page());
        return page != 0 ? page : Float.compare(a.y(), b.y());
    }

    private static void interrupted() {
        if (Thread.currentThread().isInterrupted())
            throw new ScopeException(ErrorCode.IMPORT_INTERRUPTED, "Đã ngắt render PDF");
    }

    private static void issue(List<Issue> issues, String code, Plan plan, String message) {
        issues.add(new Issue(code, "BLOCKING", plan.key.id(), message, plan.scope));
    }

    private static void failPage(
            Map<Key, Plan> plans, List<Issue> issues, int page, String code, String message) {
        for (var plan : plans.values())
            if (plan.regions.stream().anyMatch(r -> r.page() == page)) {
                plan.failed = true;
                issue(issues, code, plan, message);
            }
    }

    private static void discover(
            Map<Key, Plan> plans,
            List<Graphic> graphics,
            List<Question> questions,
            int page,
            List<Issue> issues) {
        // Small paths (axes, curves and boxes) form one illustration. Never merge across pages or
        // owners.
        for (var question : questions)
            for (var owner : List.of(Owner.QUESTION, Owner.EXPLANATION)) {
                var reference =
                        plans.get(new Key(question.clientId(), owner, Purpose.SOURCE_REFERENCE));
                if (reference == null) continue;
                var area =
                        reference.regions.stream()
                                .filter(r -> r.page() == page)
                                .findFirst()
                                .orElse(null);
                if (area == null) continue;
                var boxes = new ArrayList<TextBox>();
                boolean clipped = false;
                for (var graphic : graphics) {
                    var b = graphic.box();
                    if (!graphic.image() && (b.right() - b.left() < 1 || b.bottom() - b.top() < 1))
                        continue;
                    if (b.top() < area.box().top() || b.bottom() > area.box().bottom()) {
                        if (b.bottom() > area.box().top()
                                && b.top() < area.box().bottom()
                                && b.right() - b.left() >= 12
                                && b.bottom() - b.top() >= 12) clipped = true;
                        continue;
                    }
                    boxes.add(b);
                }
                if (clipped)
                    issues.add(
                            new Issue(
                                    "MEDIA_GRAPHIC_BOUNDARY_UNCERTAIN",
                                    "BLOCKING",
                                    question.clientId(),
                                    "Hình vẽ/ảnh vượt ranh giới câu hoặc lời giải; cần chọn lại"
                                        + " vùng",
                                    reference.scope));
                var merged = merge(boxes);
                for (var b : merged) {
                    if (b.right() - b.left() < 12 || b.bottom() - b.top() < 12) continue;
                    // Crop only within the owner's source; padding must not include the next
                    // question/solution.
                    var box =
                            new TextBox(
                                    Math.max(0, b.left() - 8),
                                    Math.max(area.box().top(), b.top() - 8),
                                    Math.min(area.box().right(), b.right() + 8),
                                    Math.min(area.box().bottom(), b.bottom() + 8));
                    Owner target = owner;
                    String id = question.clientId();
                    if (owner == Owner.QUESTION) {
                        var options =
                                question.group().options().stream()
                                        .filter(
                                                o ->
                                                        o.textRegions().stream()
                                                                .anyMatch(
                                                                        r ->
                                                                                r.page() == page
                                                                                        && inside(
                                                                                                r
                                                                                                        .box(),
                                                                                                box)))
                                        .toList();
                        if (options.size() == 1) {
                            target = Owner.OPTION;
                            id = options.getFirst().clientId();
                        }
                    }
                    var key = new Key(id, target, Purpose.ILLUSTRATION);
                    var plan = plans.computeIfAbsent(key, k -> new Plan(k, reference.scope));
                    plan.regions.add(new Region(page, box));
                }
                if (!merged.isEmpty())
                    issues.add(
                            new Issue(
                                    "MEDIA_TARGET_REVIEW_REQUIRED",
                                    "WARNING",
                                    question.clientId(),
                                    "Kiểm tra vùng cắt và vị trí gắn ảnh; hình nhỏ/công thức có thể"
                                        + " cần chọn lại",
                                    reference.scope));
            }
    }

    private static boolean inside(TextBox outer, TextBox inner) {
        return inner.left() >= outer.left()
                && inner.top() >= outer.top()
                && inner.right() <= outer.right()
                && inner.bottom() <= outer.bottom();
    }

    private static List<TextBox> merge(List<TextBox> source) {
        var result = new ArrayList<TextBox>();
        for (var initial : source) {
            var box = initial;
            for (int i = 0; i < result.size(); ) {
                var other = result.get(i);
                if (box.left() <= other.right() + 6
                        && box.right() + 6 >= other.left()
                        && box.top() <= other.bottom() + 6
                        && box.bottom() + 6 >= other.top()) {
                    box =
                            new TextBox(
                                    Math.min(box.left(), other.left()),
                                    Math.min(box.top(), other.top()),
                                    Math.max(box.right(), other.right()),
                                    Math.max(box.bottom(), other.bottom()));
                    result.remove(i);
                    i = 0;
                } else i++;
            }
            result.add(box);
        }
        return result;
    }

    private static final class BoundedOutput extends ByteArrayOutputStream {
        private final long limit;

        BoundedOutput(long limit) {
            this.limit = limit;
        }

        @Override
        public synchronized void write(byte[] b, int off, int len) {
            if ((long) count + len > limit) throw new ImageLimitException();
            super.write(b, off, len);
        }

        @Override
        public synchronized void write(int b) {
            if (count >= limit) throw new ImageLimitException();
            super.write(b);
        }
    }

    private static final class ImageLimitException extends RuntimeException {}

    private static final class GraphicsReader extends PDFGraphicsStreamEngine {
        final List<Graphic> graphics = new ArrayList<>();
        private final PDPage page;
        private final long imageLimit;
        private final GeneralPath path = new GeneralPath();
        private int clip = -1, operations;

        GraphicsReader(PDPage page, long imageLimit) {
            super(page);
            this.page = page;
            this.imageLimit = imageLimit;
        }

        @Override
        protected void processOperator(Operator operator, List<COSBase> operands)
                throws IOException {
            if (++operations > 500_000)
                throw new ScopeException(ErrorCode.PDF_LIMIT_EXCEEDED, "Trang PDF quá phức tạp");
            if ((operations & 1023) == 0) interrupted();
            super.processOperator(operator, operands);
        }

        private void graphic(Rectangle2D rectangle, boolean image) {
            if (graphics.size() >= 2000)
                throw new ScopeException(
                        ErrorCode.PDF_LIMIT_EXCEEDED, "Trang có quá nhiều vùng đồ họa");
            var crop = page.getCropBox();
            float left = (float) rectangle.getMinX() - crop.getLowerLeftX(),
                    right = (float) rectangle.getMaxX() - crop.getLowerLeftX();
            float top = crop.getUpperRightY() - (float) rectangle.getMaxY(),
                    bottom = crop.getUpperRightY() - (float) rectangle.getMinY();
            graphics.add(
                    new Graphic(
                            new TextBox(
                                    Math.max(0, left),
                                    Math.max(0, top),
                                    Math.min(crop.getWidth(), right),
                                    Math.min(crop.getHeight(), bottom)),
                            image));
        }

        private void reset() {
            if (clip >= 0) {
                path.setWindingRule(clip);
                getGraphicsState().intersectClippingPath(path);
            }
            clip = -1;
            path.reset();
        }

        private void finish(boolean fill) {
            var area = new Area(fill ? path : new java.awt.BasicStroke(1).createStrokedShape(path));
            area.intersect(getGraphicsState().getCurrentClippingPath());
            if (!area.isEmpty()) graphic(area.getBounds2D(), false);
            reset();
        }

        @Override
        public void appendRectangle(Point2D a, Point2D b, Point2D c, Point2D d) {
            path.moveTo(a.getX(), a.getY());
            path.lineTo(b.getX(), b.getY());
            path.lineTo(c.getX(), c.getY());
            path.lineTo(d.getX(), d.getY());
            path.closePath();
        }

        @Override
        public void moveTo(float x, float y) {
            path.moveTo(x, y);
        }

        @Override
        public void lineTo(float x, float y) {
            path.lineTo(x, y);
        }

        @Override
        public void curveTo(float a, float b, float c, float d, float e, float f) {
            path.curveTo(a, b, c, d, e, f);
        }

        @Override
        public Point2D getCurrentPoint() {
            return path.getCurrentPoint();
        }

        @Override
        public void closePath() {
            path.closePath();
        }

        @Override
        public void clip(int rule) {
            clip = rule;
        }

        @Override
        public void endPath() {
            reset();
        }

        @Override
        public void strokePath() {
            finish(false);
        }

        @Override
        public void fillPath(int rule) {
            finish(true);
        }

        @Override
        public void fillAndStrokePath(int rule) {
            finish(false);
        }

        @Override
        public void shadingFill(COSName name) {}

        @Override
        public void drawImage(PDImage image) {
            if ((long) image.getWidth() * image.getHeight() > imageLimit)
                throw new ScopeException(
                        ErrorCode.PDF_LIMIT_EXCEEDED, "Ảnh nhúng vượt giới hạn pixel giải mã");
            var matrix = getGraphicsState().getCurrentTransformationMatrix();
            var shape = new GeneralPath();
            var a = matrix.transformPoint(0, 0);
            shape.moveTo(a.x, a.y);
            for (var point :
                    List.of(
                            matrix.transformPoint(1, 0),
                            matrix.transformPoint(1, 1),
                            matrix.transformPoint(0, 1))) shape.lineTo(point.x, point.y);
            shape.closePath();
            var area = new Area(shape);
            area.intersect(getGraphicsState().getCurrentClippingPath());
            if (!area.isEmpty()) graphic(area.getBounds2D(), true);
        }
    }
}
