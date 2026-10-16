package com.classmanagement.backend.service.exam.pdf;

import static org.junit.jupiter.api.Assertions.*;

import com.classmanagement.backend.dto.exam.CreateCompleteExamRequest;
import com.classmanagement.backend.dto.exam.CreateCompleteExamRequest.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.service.exam.pdf.PdfExamMediaExtractor.Owner;
import com.classmanagement.backend.service.exam.pdf.PdfExamMediaExtractor.Purpose;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class PdfExamReviewMapperTest {
    private final UUID questionImage = UUID.randomUUID();
    private final UUID optionImage = UUID.randomUUID();
    private final UUID explanationImage = UUID.randomUUID();

    private PdfExamImportService.Review preview() {
        var option = new PdfExamStructureParser.Option("option-1", "A", "old", null, null, List.of());
        var answer = new PdfExamStructureParser.AnswerGroup("group-1", AnswerType.SINGLE_CHOICE,
                null, null, List.of(option));
        var question = new PdfExamStructureParser.Question("question-1", 1, "old", "old", null,
                null, answer, List.of(), "old explanation", null);
        var section = new PdfExamStructureParser.Section("section-1", "I", "Old", "Old",
                AnswerType.SINGLE_CHOICE, null, null, null, List.of(question));
        var structure = new PdfExamStructureParser.Structure(null, List.of(section), List.of(), true, false, true);
        return new PdfExamImportService.Review("test", "hash", "layout", structure, List.of(), List.of(
                media(questionImage, "question-1", Owner.QUESTION),
                media(optionImage, "option-1", Owner.OPTION),
                media(explanationImage, "question-1", Owner.EXPLANATION)), null, null);
    }

    private PdfExamImportService.Media media(UUID id, String ownerId, Owner owner) {
        return new PdfExamImportService.Media(id, "hash", ownerId, owner, Purpose.ILLUSTRATION,
                List.of(), List.of(), 10, 10, true, true, "/private");
    }

    private CreateCompleteExamRequest request(List<UUID> selected) {
        var option = new Option("Edited option", null, null, true, null);
        var answer = new Answer(AnswerType.SINGLE_CHOICE, null, null, null, BigDecimal.ONE,
                ScoringType.PER_ANSWER, null, false, List.of(option), null);
        var question = new Question("Edited stem", "Edited solution", null, null, BigDecimal.ONE, List.of(answer));
        return new CreateCompleteExamRequest(null, null, UUID.randomUUID(),
                List.of(new Section("Edited section", null, null, null, List.of(question))),
                new ImportReview(UUID.randomUUID(), true, selected));
    }

    @Test
    void mapsQuestionOptionAndExplanationToTheirCorrectMediaFields() {
        var request = request(List.of(questionImage, optionImage, explanationImage));
        var mapper = new PdfExamReviewMapper(preview(), request);
        var questionId = UUID.randomUUID();
        var optionId = UUID.randomUUID();
        var explanationId = UUID.randomUUID();
        var prepared = mapper.attach(Map.of(questionImage, questionId, optionImage, optionId,
                explanationImage, explanationId));
        var question = prepared.sections().getFirst().questions().getFirst();
        assertEquals(questionId, question.imageMediaId());
        assertEquals(explanationId, question.explanationImageMediaId());
        assertEquals(optionId, question.answers().getFirst().options().getFirst().imageMediaId());
        assertEquals("Edited stem", question.content());
        assertEquals("Edited solution", question.explanation());
        assertNull(prepared.importReview());
        assertEquals(request.draftToken(), prepared.draftToken());
    }

    @Test
    void rejectsDuplicateUnknownAndIncompleteAssetSelections() {
        assertThrows(IllegalArgumentException.class,
                () -> new PdfExamReviewMapper(preview(), request(List.of(questionImage, questionImage))));
        assertThrows(IllegalArgumentException.class,
                () -> new PdfExamReviewMapper(preview(), request(List.of(UUID.randomUUID()))));
        var mapper = new PdfExamReviewMapper(preview(), request(List.of(questionImage)));
        assertThrows(IllegalArgumentException.class, () -> mapper.attach(Map.of()));
    }

    @Test
    void rejectsStructureChangesRatherThanAttachingSourceToWrongQuestion() {
        var original = request(List.of(questionImage));
        var changed = new CreateCompleteExamRequest(null, null, original.draftToken(),
                List.of(), original.importReview());
        assertThrows(IllegalArgumentException.class, () -> new PdfExamReviewMapper(preview(), changed));
    }

    @Test
    void refusesToOverwriteManuallyUploadedMedia() {
        var original = request(List.of(questionImage));
        var section = original.sections().getFirst();
        var question = section.questions().getFirst();
        var edited = new Question(question.content(), question.explanation(), UUID.randomUUID(), null,
                question.points(), question.answers());
        var changed = new CreateCompleteExamRequest(null, null, original.draftToken(),
                List.of(new Section(section.title(), null, null, null, List.of(edited))), original.importReview());
        var mapper = new PdfExamReviewMapper(preview(), changed);
        assertThrows(IllegalArgumentException.class,
                () -> mapper.attach(Map.of(questionImage, UUID.randomUUID())));
    }

    @Test
    void explicitTargetsAllowAddedQuestionsAndGroupsWithoutDroppingEditedData() {
        var original = request(List.of(questionImage, optionImage));
        var section = original.sections().getFirst();
        var first = section.questions().getFirst();
        var expanded = new Question("Added question", "Added solution", null, null,
                BigDecimal.TWO, List.of(first.answers().getFirst(), first.answers().getFirst()));
        var review = new ImportReview(original.importReview().importId(), true,
                List.of(questionImage, optionImage), List.of(
                        new IllustrationTarget(questionImage, 0, 1, null, null),
                        new IllustrationTarget(optionImage, 0, 1, 1, 0)));
        var edited = new CreateCompleteExamRequest(null, null, original.draftToken(),
                List.of(new Section("Edited", null, null, null, List.of(first, expanded))), review);
        UUID questionId = UUID.randomUUID();
        UUID optionId = UUID.randomUUID();
        var prepared = new PdfExamReviewMapper(preview(), edited)
                .attach(Map.of(questionImage, questionId, optionImage, optionId));
        var questions = prepared.sections().getFirst().questions();
        assertNull(questions.getFirst().imageMediaId());
        assertEquals(questionId, questions.get(1).imageMediaId());
        assertEquals(2, questions.get(1).answers().size());
        assertEquals(optionId, questions.get(1).answers().get(1).options().getFirst().imageMediaId());
        assertEquals("Added solution", questions.get(1).explanation());
    }

    @Test
    void noSelectedImagesPreservesArbitraryEditedStructure() {
        var original = request(List.of());
        var edited = new CreateCompleteExamRequest(null, null, original.draftToken(),
                List.of(original.sections().getFirst(), original.sections().getFirst()), original.importReview());
        assertEquals(edited.sections(), new PdfExamReviewMapper(preview(), edited).attach(Map.of()).sections());
    }
}
