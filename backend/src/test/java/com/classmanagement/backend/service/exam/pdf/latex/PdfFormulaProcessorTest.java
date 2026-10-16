package com.classmanagement.backend.service.exam.pdf.latex;

import static org.junit.jupiter.api.Assertions.*;
import com.classmanagement.backend.service.exam.pdf.PdfExamMediaExtractor.*;
import com.classmanagement.backend.service.exam.pdf.PdfExamScopeParser.TextBox;
import com.classmanagement.backend.service.exam.pdf.PdfExamStructureParser.Region;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class PdfFormulaProcessorTest {
    @TempDir Path temporary;

    private Asset asset(String ownerId, int page) {
        var region = new Region(page, new TextBox(0, 100, 100, 300));
        return new Asset(ownerId, Owner.QUESTION, Purpose.SOURCE_REFERENCE,
                List.of(region), 100, 200, new byte[] {1, 2, 3}, true, true,
                List.of(new SourceSlice(region, 0, 100, 200)));
    }

    private PdfFormulaProcessor configured(Path tools) {
        return new PdfFormulaProcessor(new PdfFormulaProcessor.Configuration(
                System.getProperty("formula.python", "python"),
                System.getProperty("formula.node", "node"), tools, temporary,
                Duration.ofSeconds(20)));
    }

    private void prepareRenderer() throws Exception {
        var realChecker = Path.of("tools/formula/latex_check.mjs").toAbsolutePath().toUri().toString();
        Files.writeString(temporary.resolve("latex_check.mjs"), """
                import { checkBatch } from '%s';
                let data = '';
                for await (const part of process.stdin) data += part;
                process.stdout.write(JSON.stringify({results: await checkBatch(JSON.parse(data).formulas)}));
                """.formatted(realChecker));
    }

    @Test
    void mapsDetectedPixelsToTheirOriginalPageAndRejectsCompositeGaps() {
        var asset = asset("question-1", 7);
        var source = PdfFormulaProcessor.mapSource(asset, new TextBox(10, 20, 30, 40));
        assertEquals(7, source.page());
        assertEquals(new TextBox(10, 120, 30, 140), source.box());
        assertNull(PdfFormulaProcessor.mapSource(asset, new TextBox(10, 190, 30, 210)));

        var first = new Region(1, new TextBox(0, 100, 100, 150));
        var second = new Region(2, new TextBox(0, 200, 100, 250));
        var composite = new Asset("q", Owner.QUESTION, Purpose.SOURCE_REFERENCE,
                List.of(first, second), 100, 108, new byte[] {1}, true, true,
                List.of(new SourceSlice(first, 0, 100, 50), new SourceSlice(second, 58, 100, 50)));
        assertNull(PdfFormulaProcessor.mapSource(composite, new TextBox(10, 48, 30, 62)));
        assertEquals(2, PdfFormulaProcessor.mapSource(composite, new TextBox(10, 60, 30, 70)).page());
    }

    @Test
    void unavailableModelLeavesSourceReviewBlockingRatherThanPretendingSuccess() {
        var processor = new PdfFormulaProcessor(new PdfFormulaProcessor.Configuration(
                "missing-formula-python-47392", "node", temporary, temporary, Duration.ofSeconds(1)));
        var result = processor.recognize(List.of(asset("question-1", 1)));
        assertFalse(result.latexChecked());
        assertTrue(result.formulas().isEmpty());
        assertTrue(result.issues().stream().anyMatch(i -> i.code().equals("FORMULA_SOURCE_REVIEW_REQUIRED")));
        assertTrue(result.issues().stream().anyMatch(i -> i.code().equals("LOCAL_FORMULA_PROCESS_UNAVAILABLE")));
    }

    @Test
    void keepsSyntaxRenderingAndSourceReviewSeparateWithRealMathLive() {
        Assumptions.assumeTrue(System.getProperty("formula.node") != null);
        var processor = configured(Path.of("tools/formula"));
        var checks = processor.checkLatex(List.of("\\sqrt{x^2}", "\\frac{1}", "x^"));
        assertEquals("VALID", checks.get(0).syntaxStatus());
        assertEquals("VALID", checks.get(0).renderStatus());
        assertEquals("INVALID", checks.get(1).syntaxStatus());
        assertEquals("INVALID", checks.get(2).syntaxStatus());
    }

    @Test
    void batchDeduplicatesImagesAndBindsEachFormulaToItsOwnSource() throws Exception {
        Assumptions.assumeTrue(System.getProperty("formula.node") != null
                && System.getProperty("formula.python") != null);
        var worker = """
                import json, sys
                data = json.load(sys.stdin)
                assert len(data['images']) == 1
                print(json.dumps({'version': 'test-fixture', 'formulas': [{
                    'imageId': data['images'][0]['id'], 'box': [10, 10, 30, 30],
                    'latex': r'\\frac{1}{2}'
                }]}))
                """;
        Files.writeString(temporary.resolve("recognize.py"), worker);
        prepareRenderer();
        var result = configured(temporary).recognize(List.of(asset("question-1", 1), asset("question-2", 5)));
        assertEquals(2, result.formulas().size());
        assertEquals(List.of(1, 5), result.formulas().stream().map(f -> f.source().page()).toList());
        assertTrue(result.formulas().stream().allMatch(f -> f.reviewRequired()
                && f.syntaxStatus().equals("VALID") && f.renderStatus().equals("VALID")));
        assertFalse(result.latexChecked());
        assertNotEquals(result.formulas().get(0).id(), result.formulas().get(1).id());
    }

    @Test
    void emptyOcrRemainsAnUnresolvedFormulaWithoutDiscardingTheWholeBatch() throws Exception {
        Assumptions.assumeTrue(System.getProperty("formula.node") != null
                && System.getProperty("formula.python") != null);
        Files.writeString(temporary.resolve("recognize.py"), """
                import json, sys
                data = json.load(sys.stdin)
                print(json.dumps({'version': 'test-fixture', 'formulas': [{
                    'imageId': data['images'][0]['id'], 'box': [10, 10, 30, 30], 'latex': ''
                }]}))
                """);
        prepareRenderer();
        var result = configured(temporary).recognize(List.of(asset("q", 1)));
        assertEquals(1, result.formulas().size());
        assertEquals("INVALID", result.formulas().getFirst().syntaxStatus());
        assertEquals("test-fixture", result.recognizerVersion());
        assertFalse(result.latexChecked());
    }

    @Test
    void ignoresIllustrationsAndBoundsTeacherEditedFormulaBatches() {
        var processor = configured(temporary);
        assertFalse(processor.recognize(List.of()).latexChecked());
        var source = asset("q", 1);
        var illustration = new Asset(source.ownerId(), source.owner(), Purpose.ILLUSTRATION,
                source.sources(), source.width(), source.height(), source.png(), true, true,
                source.slices());
        assertTrue(processor.recognize(List.of(illustration)).issues().isEmpty());
        assertThrows(IllegalArgumentException.class,
                () -> processor.checkLatex(List.of("x".repeat(4097))));
    }
}
