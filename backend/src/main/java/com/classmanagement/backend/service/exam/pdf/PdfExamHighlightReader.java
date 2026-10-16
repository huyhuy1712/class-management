package com.classmanagement.backend.service.exam.pdf;

import static com.classmanagement.backend.service.exam.pdf.PdfExamScopeParser.*;

import org.apache.pdfbox.contentstream.PDFGraphicsStreamEngine;
import org.apache.pdfbox.contentstream.operator.Operator;
import org.apache.pdfbox.cos.COSBase;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.graphics.image.PDImage;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotationTextMarkup;

import java.awt.geom.*;
import java.io.IOException;
import java.util.*;

/** Bounded, read-only evidence extraction. Does not render, upload, or decide any answer. */
public final class PdfExamHighlightReader {
    private PdfExamHighlightReader() {}

    public record Highlight(int page, TextBox box, String kind) {}

    static List<Highlight> read(PDDocument document, Range range, PdfExamLayout layout)
            throws IOException {
        var result = new ArrayList<Highlight>();
        int last = range.end().page() - (range.end().y() == 0 ? 1 : 0);
        for (int page = range.start().page(); page <= last; page++) {
            if (Thread.currentThread().isInterrupted())
                throw new ScopeException(ErrorCode.IMPORT_INTERRUPTED, "Đã ngắt đọc đánh dấu PDF");
            var source = document.getPage(page - 1);
            // Text direction and rotated annotation geometry need a separate, tested layout
            // adapter.
            // Skipping unsupported geometry leaves the answer unresolved instead of inventing
            // evidence.
            if (Math.floorMod(source.getRotation(), 360) != 0) continue;
            new Reader(source, page, range, result, layout).processPage(source);
            var annotations = source.getAnnotations();
            if (annotations.size() > 20_000)
                throw new ScopeException(
                        ErrorCode.PDF_LIMIT_EXCEEDED, "Trang PDF có quá nhiều annotation");
            for (var annotation : annotations) {
                if (!(annotation instanceof PDAnnotationTextMarkup mark)
                        || !"Highlight".equals(mark.getSubtype())
                        || mark.isHidden()
                        || mark.isInvisible()
                        || mark.isNoView()
                        || mark.getConstantOpacity() <= 0) continue;
                if (mark.getColor() == null
                        || layout.highlightKind(mark.getColor().toRGB()).isEmpty()) continue;
                float[] quads = mark.getQuadPoints();
                if (quads == null || quads.length % 8 != 0) continue;
                for (int i = 0; i < quads.length; i += 8) {
                    var box = new Rectangle2D.Float(quads[i], quads[i + 1], 0, 0);
                    for (int j = i + 2; j < i + 8; j += 2) box.add(quads[j], quads[j + 1]);
                    add(source, page, range, result, box, "ANNOTATION_HIGHLIGHT");
                }
            }
        }
        return List.copyOf(result);
    }

    private static void add(
            PDPage source,
            int page,
            Range range,
            List<Highlight> result,
            Rectangle2D rectangle,
            String kind) {
        var crop = source.getCropBox();
        float left = (float) rectangle.getMinX() - crop.getLowerLeftX(),
                right = (float) rectangle.getMaxX() - crop.getLowerLeftX();
        float top = crop.getUpperRightY() - (float) rectangle.getMaxY(),
                bottom = crop.getUpperRightY() - (float) rectangle.getMinY();
        // A mark crossing a scope boundary is not trusted.
        if (right <= left
                || bottom <= top
                || left < 0
                || top < 0
                || right > crop.getWidth()
                || bottom > crop.getHeight()) return;
        if (page == range.start().page() && top < range.start().y()
                || page == range.end().page() && bottom > range.end().y()) return;
        if (result.size() >= 20_000)
            throw new ScopeException(ErrorCode.PDF_LIMIT_EXCEEDED, "Quá nhiều vùng đánh dấu PDF");
        result.add(new Highlight(page, new TextBox(left, top, right, bottom), kind));
    }

    private static final class Reader extends PDFGraphicsStreamEngine {
        private final PDPage page;
        private final int number;
        private final Range range;
        private final List<Highlight> result;
        private final PdfExamLayout layout;
        private final GeneralPath path = new GeneralPath();
        private boolean rectangular = true;
        private int rectangles, operations;
        private int clipRule = -1;

        Reader(PDPage page, int number, Range range, List<Highlight> result, PdfExamLayout layout) {
            super(page);
            this.page = page;
            this.number = number;
            this.range = range;
            this.result = result;
            this.layout = layout;
        }

        @Override
        protected void processOperator(Operator operator, List<COSBase> operands)
                throws IOException {
            if (++operations > 1_000_000)
                throw new ScopeException(ErrorCode.PDF_LIMIT_EXCEEDED, "Trang PDF quá phức tạp");
            if ((operations & 1023) == 0 && Thread.currentThread().isInterrupted())
                throw new ScopeException(ErrorCode.IMPORT_INTERRUPTED, "Đã ngắt đọc đánh dấu PDF");
            super.processOperator(operator, operands);
        }

        @Override
        public void appendRectangle(Point2D a, Point2D b, Point2D c, Point2D d) {
            path.moveTo(a.getX(), a.getY());
            path.lineTo(b.getX(), b.getY());
            path.lineTo(c.getX(), c.getY());
            path.lineTo(d.getX(), d.getY());
            path.closePath();
            rectangles++;
        }

        @Override
        public void moveTo(float x, float y) {
            rectangular = false;
            path.moveTo(x, y);
        }

        @Override
        public void lineTo(float x, float y) {
            path.lineTo(x, y);
        }

        @Override
        public void curveTo(float a, float b, float c, float d, float e, float f) {
            rectangular = false;
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
            clipRule = rule;
        }

        private void reset() {
            if (clipRule >= 0) {
                path.setWindingRule(clipRule);
                getGraphicsState().intersectClippingPath(path);
            }
            clipRule = -1;
            path.reset();
            rectangles = 0;
            rectangular = true;
        }

        @Override
        public void endPath() {
            reset();
        }

        @Override
        public void strokePath() {
            reset();
        }

        @Override
        public void fillPath(int rule) throws IOException {
            var state = getGraphicsState();
            var kind = layout.highlightKind(state.getNonStrokingColor().toRGB());
            if (rectangular
                    && rectangles == 1
                    && state.getNonStrokeAlphaConstant() > 0
                    && kind.isPresent()) {
                var area = new Area(path);
                area.intersect(state.getCurrentClippingPath());
                // Do not turn a slanted or clipped polygon into an oversized bounding box.
                if (area.isRectangular())
                    add(page, number, range, result, area.getBounds2D(), kind.get());
            }
            reset();
        }

        @Override
        public void fillAndStrokePath(int rule) throws IOException {
            fillPath(rule);
        }

        @Override
        public void drawImage(PDImage image) {}

        @Override
        public void shadingFill(COSName name) {}
    }
}
