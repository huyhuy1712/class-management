package com.classmanagement.backend.service.exam.pdf;

import static org.junit.jupiter.api.Assertions.*;

import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.exception.ConflictException;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.exam.PdfExamImportRepository;
import com.classmanagement.backend.repository.exam.PdfExamImportRepository.Job;
import com.classmanagement.backend.service.exam.pdf.latex.PdfFormulaProcessor;
import com.classmanagement.backend.dto.exam.CreateCompleteExamRequest;
import com.classmanagement.backend.dto.exam.CreateCompleteExamRequest.*;
import com.classmanagement.backend.dto.exam.CreateExamResponse;
import com.classmanagement.backend.dto.exam.ExamMediaResponse;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.service.ExamService;
import com.classmanagement.backend.service.ExamMediaService;
import com.classmanagement.backend.service.exam.validation.ExamStructureValidator;
import com.classmanagement.backend.exception.ExamValidationException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import org.springframework.transaction.support.*;
import org.springframework.transaction.TransactionDefinition;
import jakarta.validation.Validation;
import org.hibernate.validator.messageinterpolation.ParameterMessageInterpolator;
import java.lang.reflect.Proxy;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

class PdfExamImportServiceTest {
    @TempDir
    Path temporary;

    private final MemoryJobs jobs = new MemoryJobs();
    private UserRole role = UserRole.TEACHER;
    private UserStatus status = UserStatus.ACTIVE;
    private int recognitionCalls;
    private int creates;
    private int uploadBatches;
    private boolean invalidLatex;
    private boolean failCreate;
    private CreateCompleteExamRequest persisted;
    private List<String> checkedFormulas;

    private PdfExamImportService service() {
        var users = (UserRepository) Proxy.newProxyInstance(
                getClass().getClassLoader(), new Class<?>[] {UserRepository.class}, (proxy, method, args) -> {
                    if (method.getName().equals("findByUsername")) {
                        return Optional.of(User.builder().id(args[0].equals("owner") ? 1L : 2L)
                                .role(role).status(status).build());
                    }
                    throw new UnsupportedOperationException(method.getName());
                });
        var pipeline = new PdfExamImportPipeline(assets -> {
            recognitionCalls++;
            return new PdfFormulaProcessor.Result(List.of(), List.of(), "test-offline", false);
        });
        return new PdfExamImportService(jobs, users, files(), pipeline);
    }

    private PdfImportFiles files() {
        return new PdfImportFiles(temporary.resolve("private"), temporary.resolve("uploads"));
    }

    private MockMultipartFile file() {
        return new MockMultipartFile("file", "../../ignored.pdf", "application/pdf",
                "%PDF-1.7\nnot yet parsed".getBytes(StandardCharsets.US_ASCII));
    }

    private MockMultipartFile validPdf() throws Exception {
        var path = temporary.resolve("exam.pdf");
        try (var document = new PDDocument()) {
            var page = new PDPage();
            document.addPage(page);
            try (var out = new PDPageContentStream(document, page)) {
                out.beginText();
                out.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                out.newLineAtOffset(45, 740);
                out.setLeading(22);
                for (var line : List.of(
                        "DE 1", "PHAN I. Nhieu phuong an lua chon", "Cau 1: Editable stem",
                        "A. One B. Two C. Three D. Four", "HUONG DAN GIAI CHI TIET",
                        "PHAN I. Nhieu phuong an lua chon", "Cau 1: Answer source", "Chon B")) {
                    out.showText(line);
                    out.newLine();
                }
                out.endText();
            }
            document.save(path.toFile());
        }
        return new MockMultipartFile("file", "exam.pdf", "application/pdf", Files.readAllBytes(path));
    }

    @Test
    void uploadIsQueuedAndIdempotentWithoutRunningOcrOrKeepingDuplicateFiles() throws Exception {
        var service = service();
        var request = UUID.randomUUID();
        var first = service.upload("owner", file(), 1, request);
        var repeated = service.upload("owner", file(), 1, request);
        assertEquals(first.importId(), repeated.importId());
        assertEquals("QUEUED", first.status());
        assertEquals(3000, first.pollAfterMs());
        assertNull(first.preview());
        assertEquals(0, recognitionCalls);
        assertEquals(1, files().directories().size());
        assertThrows(ConflictException.class, () -> service.upload("owner", file(), 2, request));
        assertEquals(1, files().directories().size());
    }

    @Test
    void ownershipIsHiddenAndNonActiveTeachersCannotUpload() {
        var service = service();
        var job = service.upload("owner", file(), 1, UUID.randomUUID());
        assertThrows(ResourceNotFoundException.class, () -> service.get("other", job.importId()));
        role = UserRole.STUDENT;
        assertThrows(IllegalStateException.class,
                () -> service.upload("owner", file(), 1, UUID.randomUUID()));
        role = UserRole.TEACHER;
        status = UserStatus.INACTIVE;
        assertThrows(IllegalStateException.class, () -> service.get("owner", job.importId()));
    }

    @Test
    void validatesPdfSignatureAndPositiveNumberBeforeCreatingPrivateFiles() throws Exception {
        var service = service();
        var bad = new MockMultipartFile("file", "looks-like.pdf", "application/pdf", new byte[] {1});
        var error = assertThrows(ResponseStatusException.class,
                () -> service.upload("owner", bad, 1, UUID.randomUUID()));
        assertEquals(HttpStatus.UNSUPPORTED_MEDIA_TYPE, error.getStatusCode());
        assertThrows(IllegalArgumentException.class,
                () -> service.upload("owner", file(), 0, UUID.randomUUID()));
        assertTrue(files().directories().isEmpty());
    }

    @Test
    void rejectsOversizedPdfBeforeWritingToDisk() throws Exception {
        var bytes = new byte[10 * 1024 * 1024 + 1];
        var file = new MockMultipartFile("file", "large.pdf", "application/pdf", bytes);
        var error = assertThrows(ResponseStatusException.class,
                () -> service().upload("owner", file, 1, UUID.randomUUID()));
        assertEquals(HttpStatus.PAYLOAD_TOO_LARGE, error.getStatusCode());
        assertTrue(files().directories().isEmpty());
        assertTrue(jobs.rows.isEmpty());
    }

    @Test
    void disabledImportRejectsUploadInsteadOfQueuingAnUnserviceableJob() throws Exception {
        var service = service();
        var enabled = PdfExamImportService.class.getDeclaredField("enabled");
        enabled.setAccessible(true);
        enabled.setBoolean(service, false);
        var error = assertThrows(ResponseStatusException.class,
                () -> service.upload("owner", file(), 1, UUID.randomUUID()));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, error.getStatusCode());
        assertTrue(jobs.rows.isEmpty());
        assertTrue(files().directories().isEmpty());
    }

    @Test
    void workerBuildsPrivateMetadataAndGetNeverRerunsPipeline() throws Exception {
        var service = service();
        var accepted = service.upload("owner", validPdf(), 1, UUID.randomUUID());
        var claimed = jobs.claim(PdfExamImportService.now()).orElseThrow();
        service.process(claimed);
        var response = service.get("owner", accepted.importId());
        assertEquals("READY_FOR_REVIEW", response.status());
        assertEquals(0, response.pollAfterMs());
        assertNotNull(response.draftToken());
        assertEquals(1, response.preview().path("counts").path("questions").asInt());
        assertFalse(response.preview().path("structure").path("latexChecked").asBoolean());
        var asset = response.preview().path("media").get(0);
        assertFalse(asset.has("png"));
        assertFalse(response.preview().toString().contains(temporary.toString()));
        UUID assetId = UUID.fromString(asset.path("id").asText());
        assertTrue(service.asset("owner", accepted.importId(), assetId).length > 0);
        assertThrows(ResourceNotFoundException.class,
                () -> service.asset("other", accepted.importId(), assetId));
        assertThrows(ResourceNotFoundException.class,
                () -> service.asset("owner", accepted.importId(), UUID.randomUUID()));
        service.get("owner", accepted.importId());
        assertEquals(1, recognitionCalls);
    }

    @Test
    void malformedPdfFailsAsynchronouslyAndDoesNotExposeFilesystemPath() {
        var service = service();
        var accepted = service.upload("owner", file(), 1, UUID.randomUUID());
        service.process(jobs.claim(PdfExamImportService.now()).orElseThrow());
        var response = service.get("owner", accepted.importId());
        assertEquals("FAILED", response.status());
        assertNull(response.preview());
        assertFalse(response.errorMessage().contains(temporary.toString()));
        assertEquals(0, recognitionCalls);
    }

    @Test
    void expiredJobDoesNotExposePreviewOrAssetsBeforeCleanupRuns() throws Exception {
        var service = service();
        var accepted = service.upload("owner", validPdf(), 1, UUID.randomUUID());
        service.process(jobs.claim(PdfExamImportService.now()).orElseThrow());
        var job = jobs.rows.get(accepted.importId());
        jobs.rows.put(job.id(), jobs.copy(job, job.status(), job.result(), job.leaseToken(),
                LocalDateTime.of(2020, 1, 1, 0, 0), null));
        var response = service.get("owner", accepted.importId());
        assertEquals("EXPIRED", response.status());
        assertNull(response.preview());
        assertThrows(ResourceNotFoundException.class,
                () -> service.asset("owner", accepted.importId(), UUID.randomUUID()));
    }

    private void saving(PdfExamImportService service) {
        var exams = (ExamService) Proxy.newProxyInstance(getClass().getClassLoader(),
                new Class<?>[] {ExamService.class}, (proxy, method, args) -> {
                    assertEquals("createCompleteExam", method.getName());
                    assertTrue(TransactionSynchronizationManager.isActualTransactionActive());
                    creates++;
                    if (failCreate) throw new ConflictException("Targets changed");
                    persisted = (CreateCompleteExamRequest) args[1];
                    assertNull(persisted.importReview());
                    return new CreateExamResponse(91L, "EX-TEST", ExamStatus.DRAFT, BigDecimal.ONE,
                            92L, LocalDateTime.of(2026, 10, 16, 0, 0));
                });
        var media = (ExamMediaService) Proxy.newProxyInstance(getClass().getClassLoader(),
                new Class<?>[] {ExamMediaService.class}, (proxy, method, args) -> {
                    assertEquals("uploadGeneratedImages", method.getName());
                    assertFalse(TransactionSynchronizationManager.isActualTransactionActive());
                    uploadBatches++;
                    var result = new LinkedHashMap<UUID, ExamMediaResponse>();
                    @SuppressWarnings("unchecked")
                    var images = (Map<UUID, byte[]>) args[2];
                    images.forEach((id, bytes) -> result.put(id, new ExamMediaResponse(UUID.randomUUID(),
                            (UUID) args[1], "reviewed.png", "https://example.invalid/reviewed.png",
                            ExamMediaType.IMAGE, "image/png", bytes.length, LocalDateTime.now().plusHours(24))));
                    return result;
                });
        var validator = Validation.byDefaultProvider().configure()
                .messageInterpolator(new ParameterMessageInterpolator()).buildValidatorFactory().getValidator();
        var transactions = new AbstractPlatformTransactionManager() {
            @Override protected Object doGetTransaction() { return new Object(); }
            @Override protected void doBegin(Object transaction, TransactionDefinition definition) {}
            @Override protected void doCommit(DefaultTransactionStatus status) {}
            @Override protected void doRollback(DefaultTransactionStatus status) {}
        };
        service.configureSave(new PdfExamImportService.SaveDependencies(exams, media,
                new ExamStructureValidator(validator), new TransactionTemplate(transactions), formulas -> {
                    assertFalse(TransactionSynchronizationManager.isActualTransactionActive());
                    checkedFormulas = List.copyOf(formulas);
                    var result = new ArrayList<PdfFormulaProcessor.Check>();
                    for (int index = 0; index < formulas.size(); index++) {
                        result.add(new PdfFormulaProcessor.Check(Integer.toString(index),
                                invalidLatex ? "INVALID" : "VALID", invalidLatex ? "NOT_RUN" : "VALID"));
                    }
                    return result;
                }));
    }

    private CreateCompleteExamRequest reviewRequest(Job job, boolean reviewed) {
        var options = List.of(new Option("$\\sqrt{4}$", null, null, true, null),
                new Option("Two", null, null, false, null),
                new Option("Three", null, null, false, null),
                new Option("Four", null, null, false, null));
        var answer = new Answer(AnswerType.SINGLE_CHOICE, null, null, null, BigDecimal.ONE,
                ScoringType.PER_ANSWER, null, false, options, null);
        var question = new Question("Edited $x^2$", "$\\frac{1}{2}$", null, null,
                BigDecimal.ONE, List.of(answer));
        return new CreateCompleteExamRequest(
                new BasicInfo("Reviewed PDF", 1L, "10", null, null, 45, 1),
                new Assignment(ExamAssignmentType.ALL, null, null, ScoreVisibility.NEVER,
                        AnswerVisibility.NEVER, null, false, null, null),
                job.draftToken(), List.of(new Section("Part I", null, null, null, List.of(question))),
                new ImportReview(job.id(), reviewed, List.of()));
    }

    private Job ready(PdfExamImportService service) throws Exception {
        var accepted = service.upload("owner", validPdf(), 1, UUID.randomUUID());
        service.process(jobs.claim(PdfExamImportService.now()).orElseThrow());
        return jobs.rows.get(accepted.importId());
    }

    @Test
    void reviewedSaveReusesCreationAndExactRetryDoesNotRunModelOrCreateTwice() throws Exception {
        var service = service();
        saving(service);
        var job = ready(service);
        var request = reviewRequest(job, true);
        var created = service.create("owner", request);
        assertEquals(91L, created.id());
        assertEquals(List.of("x^2", "\\frac{1}{2}", "\\sqrt{4}"), checkedFormulas);
        assertEquals(created, service.create("owner", request));
        assertEquals(created, service.get("owner", job.id()).createdExam());
        assertEquals(1, creates);
        assertEquals(1, uploadBatches);
        assertEquals(1, recognitionCalls);
        assertEquals(BigDecimal.ONE, persisted.sections().getFirst().questions().getFirst().points());
    }

    @Test
    void rejectsUndeclaredReviewAndInvalidLatexWithoutStorageOrExamWrites() throws Exception {
        var service = service();
        saving(service);
        var job = ready(service);
        var request = reviewRequest(job, true);
        var missing = new CreateCompleteExamRequest(request.basicInfo(), request.assignment(),
                request.draftToken(), request.sections());
        assertThrows(IllegalArgumentException.class, () -> service.requireReviewIfImport(missing));
        assertThrows(ExamValidationException.class,
                () -> service.create("owner", reviewRequest(job, false)));
        invalidLatex = true;
        assertThrows(IllegalArgumentException.class, () -> service.create("owner", request));
        assertEquals(0, creates);
        assertEquals(0, uploadBatches);
        assertTrue(jobs.saveTokens.isEmpty());
    }

    @Test
    void missingPointsAndAnswersAreRejectedByExistingValidator() throws Exception {
        var service = service();
        saving(service);
        var job = ready(service);
        var request = reviewRequest(job, true);
        var q = request.sections().getFirst().questions().getFirst();
        var incomplete = new Question(q.content(), q.explanation(), null, null, null, q.answers());
        var body = new CreateCompleteExamRequest(request.basicInfo(), request.assignment(), request.draftToken(),
                List.of(new Section("Part I", null, null, null, List.of(incomplete))), request.importReview());
        assertThrows(ExamValidationException.class, () -> service.create("owner", body));
        assertEquals(0, creates);
        assertEquals(0, uploadBatches);
    }

    @Test
    void sourceScreenshotCannotBePromotedEvenWithExplicitTeacherConfirmation() throws Exception {
        var service = service();
        saving(service);
        var job = ready(service);
        var preview = service.get("owner", job.id()).preview();
        var sourceId = UUID.fromString(preview.path("media").get(0).path("id").asText());
        var request = reviewRequest(job, true);
        var invalid = new CreateCompleteExamRequest(request.basicInfo(), request.assignment(), request.draftToken(),
                request.sections(), new ImportReview(job.id(), true, List.of(sourceId)));
        assertThrows(IllegalArgumentException.class, () -> service.create("owner", invalid));
        assertEquals(0, creates);
        assertEquals(0, uploadBatches);
    }

    @Test
    void failedFinalCreationReleasesLeaseAndCanBeRetried() throws Exception {
        var service = service();
        saving(service);
        var job = ready(service);
        var request = reviewRequest(job, true);
        failCreate = true;
        assertThrows(ConflictException.class, () -> service.create("owner", request));
        assertTrue(jobs.saveTokens.isEmpty());
        assertTrue(jobs.receipts.isEmpty());
        failCreate = false;
        assertEquals(91L, service.create("owner", request).id());
        assertEquals(2, creates);
    }

    @Test
    void savedImportCannotCreateAnotherExamWithDifferentEditedPayload() throws Exception {
        var service = service();
        saving(service);
        var job = ready(service);
        var original = reviewRequest(job, true);
        service.create("owner", original);
        var basic = original.basicInfo();
        var changed = new CreateCompleteExamRequest(
                new BasicInfo("Different title", basic.subjectId(), basic.gradeLevel(), basic.description(),
                        basic.purpose(), basic.timeLimit(), basic.maxAttempts()),
                original.assignment(), original.draftToken(), original.sections(), original.importReview());
        assertThrows(ConflictException.class, () -> service.create("owner", changed));
        assertEquals(1, creates);
        assertEquals(1, uploadBatches);
    }

    private static class MemoryJobs extends PdfExamImportRepository {
        final Map<UUID, Job> rows = new HashMap<>();
        final Map<UUID, String> hashes = new HashMap<>();
        final Map<UUID, String> receipts = new HashMap<>();
        final Map<UUID, UUID> saveTokens = new HashMap<>();

        MemoryJobs() {
            super(null);
        }

        @Override
        public Job reserve(UUID id, long owner, UUID request, String hash, long size, int exam,
                LocalDateTime now) {
            for (var job : rows.values()) {
                if (job.ownerId() == owner && job.requestId().equals(request)) {
                    if (!job.sourceHash().equals(hash) || job.examNumber() != exam) {
                        throw new ConflictException("Key conflict");
                    }
                    return job;
                }
            }
            var job = new Job(id, owner, request, hash, size, exam, "QUEUED", "WAITING",
                    UUID.randomUUID(), null, null, null, null, now, now, now.plusHours(24));
            rows.put(id, job);
            return job;
        }

        @Override
        public Optional<Job> owned(UUID id, long owner) {
            return Optional.ofNullable(rows.get(id)).filter(job -> job.ownerId() == owner);
        }

        @Override
        public Optional<Job> ownedForAsset(UUID id, long owner) {
            return owned(id, owner);
        }

        @Override
        public boolean isImportDraft(UUID token) {
            return rows.values().stream().anyMatch(job -> job.draftToken().equals(token));
        }

        @Override
        public SaveLease reserveSave(UUID id, long owner, String hash, LocalDateTime now) {
            var receipt = receipts.get(id);
            if (receipt != null) {
                if (!hash.equals(hashes.get(id))) throw new ConflictException("Import already saved");
                return new SaveLease(null, receipt);
            }
            if (saveTokens.containsKey(id)) throw new ConflictException("Busy");
            UUID token = UUID.randomUUID();
            saveTokens.put(id, token);
            hashes.put(id, hash);
            return new SaveLease(token, null);
        }

        @Override
        public void lockSave(UUID id, UUID token, LocalDateTime now) {
            assertTrue(TransactionSynchronizationManager.isActualTransactionActive());
            assertEquals(saveTokens.get(id), token);
        }

        @Override
        public void completeSave(UUID id, UUID token, String response) {
            assertTrue(TransactionSynchronizationManager.isActualTransactionActive());
            assertEquals(saveTokens.get(id), token);
            receipts.put(id, response);
            var job = rows.get(id);
            rows.put(id, new Job(job.id(), job.ownerId(), job.requestId(), job.sourceHash(), job.sourceSize(),
                    job.examNumber(), job.status(), "SAVED", job.draftToken(), job.result(),
                    job.errorCode(), job.errorMessage(), job.leaseToken(), job.createdAt(), job.updatedAt(),
                    job.expiresAt(), response));
        }

        @Override
        public void releaseSave(UUID id, UUID token) {
            saveTokens.remove(id, token);
            if (!receipts.containsKey(id)) hashes.remove(id);
        }

        @Override
        public Optional<Job> claim(LocalDateTime now) {
            var first = rows.values().stream().filter(job -> job.status().equals("QUEUED")).findFirst();
            return first.map(job -> {
                var claimed = copy(job, "PROCESSING", null, UUID.randomUUID(), job.expiresAt(), null);
                rows.put(job.id(), claimed);
                return claimed;
            });
        }

        @Override
        public boolean progress(Job job, String stage, LocalDateTime now) {
            return rows.get(job.id()).leaseToken().equals(job.leaseToken());
        }

        @Override
        public boolean ready(Job job, String json, LocalDateTime now) {
            rows.put(job.id(), copy(job, "READY_FOR_REVIEW", json, job.leaseToken(), job.expiresAt(), null));
            return true;
        }

        @Override
        public void failed(Job job, String code, String message, LocalDateTime now) {
            rows.put(job.id(), copy(job, "FAILED", null, job.leaseToken(), job.expiresAt(), message));
        }

        Job copy(Job job, String status, String result, UUID token, LocalDateTime expires, String message) {
            return new Job(job.id(), job.ownerId(), job.requestId(), job.sourceHash(), job.sourceSize(),
                    job.examNumber(), status, status, job.draftToken(), result,
                    message == null ? null : "FAILED", message, token,
                    job.createdAt(), job.updatedAt(), expires);
        }
    }
}
