package com.classmanagement.backend.service.exam.pdf;

import com.classmanagement.backend.service.exam.pdf.latex.PdfFormulaProcessor;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.function.Consumer;
import java.util.function.Function;

/** Builds a private review document. Persistence and access control belong to the job layer. */
public final class PdfExamImportPipeline {
    public enum Stage {
        INDEXING,
        READING_QUESTIONS,
        READING_SOLUTIONS,
        PREPARING_MEDIA,
        CHECKING_LATEX,
        BUILDING_PREVIEW
    }

    public record Counts(
            int sections,
            int questions,
            int media,
            int formulas,
            long blockingIssues) {}

    /** Contains source images and answers: never serialize directly into a student response. */
    public record Preview(
            String parserVersion,
            String sourceHash,
            String layoutId,
            PdfExamStructureParser.Structure structure,
            List<PdfExamSolutionParser.Evidence> answerEvidence,
            List<PdfExamMediaExtractor.Asset> media,
            PdfFormulaProcessor.Result latex,
            Counts counts) {
        public Preview {
            answerEvidence = List.copyOf(answerEvidence);
            media = List.copyOf(media);
        }
    }

    private static final String PARSER_VERSION = "pdf-review-v1";

    private final PdfExamScopeParser scopeParser = new PdfExamScopeParser();
    private final PdfExamStructureParser structureParser = new PdfExamStructureParser();
    private final PdfExamSolutionParser solutionParser = new PdfExamSolutionParser();
    private final PdfExamMediaExtractor mediaExtractor = new PdfExamMediaExtractor();
    private final Function<List<PdfExamMediaExtractor.Asset>, PdfFormulaProcessor.Result> recognize;

    public PdfExamImportPipeline(PdfFormulaProcessor formulas) {
        this(Objects.requireNonNull(formulas)::recognize);
    }

    PdfExamImportPipeline(
            Function<List<PdfExamMediaExtractor.Asset>, PdfFormulaProcessor.Result> recognize) {
        this.recognize = Objects.requireNonNull(recognize);
    }

    public Preview process(
            Path source,
            int examNumber,
            PdfExamLayout layout,
            Consumer<Stage> progress) {
        Objects.requireNonNull(source);
        Objects.requireNonNull(layout);
        Objects.requireNonNull(progress);
        if (examNumber < 1) {
            throw new IllegalArgumentException("Số đề phải là số nguyên dương");
        }

        advance(progress, Stage.INDEXING);
        var index = scopeParser.inspectForExam(source, examNumber, layout);

        advance(progress, Stage.READING_QUESTIONS);
        var questions = structureParser.parse(index, examNumber);
        requireQuestions(questions);

        advance(progress, Stage.READING_SOLUTIONS);
        var solutions = solutionParser.parse(index, questions);

        advance(progress, Stage.PREPARING_MEDIA);
        var media = mediaExtractor.extract(source, index, solutions.structure());

        advance(progress, Stage.CHECKING_LATEX);
        var latex = recognize.apply(media.assets());

        advance(progress, Stage.BUILDING_PREVIEW);
        var structure = mergeIssues(solutions.structure(), media, latex);
        var counts = new Counts(
                structure.sections().size(),
                questionCount(structure),
                media.assets().size(),
                latex.formulas().size(),
                structure.issues().stream()
                        .filter(issue -> "BLOCKING".equals(issue.severity()))
                        .count());

        return new Preview(
                PARSER_VERSION,
                index.sourceDigest(),
                layout.id(),
                structure,
                solutions.evidence(),
                media.assets(),
                latex,
                counts);
    }

    private void advance(Consumer<Stage> progress, Stage stage) {
        if (Thread.currentThread().isInterrupted()) {
            throw new PdfExamScopeParser.ScopeException(
                    PdfExamScopeParser.ErrorCode.IMPORT_INTERRUPTED,
                    "Đã dừng xử lý import PDF");
        }
        // A failed lease/progress write must stop processing, not continue publishing stale output.
        progress.accept(stage);
    }

    private int questionCount(PdfExamStructureParser.Structure structure) {
        return structure.sections().stream()
                .mapToInt(section -> section.questions().size())
                .sum();
    }

    private void requireQuestions(PdfExamStructureParser.Structure structure) {
        if (questionCount(structure) == 0) {
            throw new IllegalArgumentException(
                    "Không nhận diện được câu hỏi trong đề đã chọn với bố cục này");
        }
    }

    private PdfExamStructureParser.Structure mergeIssues(
            PdfExamStructureParser.Structure original,
            PdfExamMediaExtractor.Result media,
            PdfFormulaProcessor.Result latex) {
        var issues = new ArrayList<>(original.issues());
        issues.addAll(media.issues());
        issues.addAll(latex.issues());

        return new PdfExamStructureParser.Structure(
                original.selection(),
                original.sections(),
                List.copyOf(issues),
                original.answersResolved(),
                false,
                true);
    }
}
