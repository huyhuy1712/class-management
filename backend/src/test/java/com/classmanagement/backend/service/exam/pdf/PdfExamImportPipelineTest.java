package com.classmanagement.backend.service.exam.pdf;

import static org.junit.jupiter.api.Assertions.*;

import com.classmanagement.backend.service.exam.pdf.latex.PdfFormulaProcessor;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class PdfExamImportPipelineTest {
    @TempDir
    Path temporary;

    private Path source() throws Exception {
        var path = temporary.resolve("two-exams.pdf");
        try (var document = new PDDocument()) {
            for (int number = 1; number <= 2; number++) {
                var page = new PDPage();
                document.addPage(page);
                try (var stream = new PDPageContentStream(document, page)) {
                    stream.beginText();
                    stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                    stream.newLineAtOffset(45, 740);
                    stream.setLeading(22);
                    for (var line : List.of(
                            "DE " + number,
                            "PHAN I. Nhieu phuong an lua chon",
                            "Cau 1: Editable question " + number,
                            "A. One B. Two C. Three D. Four",
                            "HUONG DAN GIAI CHI TIET",
                            "PHAN I. Nhieu phuong an lua chon",
                            "Cau 1: Solution " + number,
                            "Loi giai",
                            "Chon B")) {
                        stream.showText(line);
                        stream.newLine();
                    }
                    stream.endText();
                }
            }
            document.save(path.toFile());
        }
        return path;
    }

    @Test
    void selectsOneExamRunsRecognitionOnceAndKeepsReviewAndPointsRequired() throws Exception {
        var batches = new AtomicInteger();
        var pipeline = new PdfExamImportPipeline(assets -> {
            batches.incrementAndGet();
            assertFalse(assets.isEmpty());
            assertTrue(assets.stream().allMatch(PdfExamMediaExtractor.Asset::teacherOnly));
            var issue = new PdfExamStructureParser.Issue(
                    "TEST_OCR_REVIEW", "BLOCKING", "latex", "Review source", null);
            return new PdfFormulaProcessor.Result(List.of(), List.of(issue), "test", false);
        });
        var stages = new ArrayList<PdfExamImportPipeline.Stage>();
        var preview = pipeline.process(source(), 2, PdfExamLayout.vietnameseThreePart(), stages::add);

        assertEquals(List.of(PdfExamImportPipeline.Stage.values()), stages);
        assertEquals(1, batches.get());
        assertEquals(2, preview.structure().selection().examNumber());
        assertEquals(1, preview.counts().questions());
        assertEquals(64, preview.sourceHash().length());
        var question = preview.structure().sections().getFirst().questions().getFirst();
        assertEquals("Editable question 2", question.rawStem());
        assertFalse(question.rawText().contains("Solution"));
        assertNull(question.points());
        assertNull(question.group().points());
        assertFalse(preview.structure().latexChecked());
        assertTrue(preview.structure().requiresPoints());
        assertTrue(preview.counts().blockingIssues() > 0);
        assertTrue(preview.structure().issues().stream()
                .anyMatch(issue -> issue.code().equals("TEST_OCR_REVIEW")));
        assertThrows(UnsupportedOperationException.class, () -> preview.media().clear());
    }

    @Test
    void missingExamFailsBeforeRecognition() throws Exception {
        var pipeline = new PdfExamImportPipeline(assets -> {
            fail("Must not recognize when selected exam is absent");
            return null;
        });
        var failure = assertThrows(PdfExamScopeParser.ScopeException.class,
                () -> pipeline.process(source(), 3, PdfExamLayout.vietnameseThreePart(), stage -> {}));
        assertEquals(PdfExamScopeParser.ErrorCode.EXAM_NOT_FOUND, failure.code());
    }

    @Test
    void lostLeaseCallbackStopsBeforeOpeningSource() {
        var pipeline = new PdfExamImportPipeline(assets -> {
            fail("Must stop after progress failure");
            return null;
        });
        var failure = new IllegalStateException("Lease lost");
        assertSame(failure, assertThrows(IllegalStateException.class,
                () -> pipeline.process(temporary.resolve("absent.pdf"), 1,
                        PdfExamLayout.vietnameseThreePart(), stage -> {
                            throw failure;
                        })));
    }

    @Test
    void interruptedJobDoesNotStartAndKeepsInterruptFlag() {
        var pipeline = new PdfExamImportPipeline(assets -> null);
        Thread.currentThread().interrupt();
        try {
            var failure = assertThrows(PdfExamScopeParser.ScopeException.class,
                    () -> pipeline.process(temporary.resolve("absent.pdf"), 1,
                            PdfExamLayout.vietnameseThreePart(), stage -> fail("Must not advance")));
            assertEquals(PdfExamScopeParser.ErrorCode.IMPORT_INTERRUPTED, failure.code());
            assertTrue(Thread.currentThread().isInterrupted());
        } finally {
            Thread.interrupted();
        }
    }
}
