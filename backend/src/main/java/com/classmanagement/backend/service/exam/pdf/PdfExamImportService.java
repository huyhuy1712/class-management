package com.classmanagement.backend.service.exam.pdf;

import com.classmanagement.backend.dto.exam.PdfExamImportResponse;
import com.classmanagement.backend.dto.exam.CreateCompleteExamRequest;
import com.classmanagement.backend.dto.exam.CreateExamResponse;
import com.classmanagement.backend.service.ExamService;
import com.classmanagement.backend.service.ExamMediaService;
import com.classmanagement.backend.service.exam.validation.ExamStructureValidator;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.exception.ConflictException;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.exam.PdfExamImportRepository;
import com.classmanagement.backend.repository.exam.PdfExamImportRepository.Job;
import com.classmanagement.backend.service.exam.pdf.latex.PdfFormulaProcessor;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.UUID;
import java.util.function.Function;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/** Owns admission and private preview assembly; reuses the pure PDF pipeline. */
@Service
public class PdfExamImportService {
    private static final org.slf4j.Logger LOG = org.slf4j.LoggerFactory.getLogger(PdfExamImportService.class);
    private static final int MAX_PDF_BYTES = 10 * 1024 * 1024;
    private static final int MAX_PREVIEW_BYTES = 4 * 1024 * 1024;

    private final PdfExamImportRepository jobs;
    private final UserRepository users;
    private final PdfImportFiles files;
    private final PdfExamImportPipeline pipeline;
    private final JsonMapper json = JsonMapper.builder().build();
    private SaveDependencies save;

    record SaveDependencies(
            ExamService exams,
            ExamMediaService media,
            ExamStructureValidator validator,
            TransactionTemplate transactions,
            Function<List<String>, List<PdfFormulaProcessor.Check>> checkLatex) {}

    @org.springframework.beans.factory.annotation.Autowired
    void configureSave(
            ExamService exams,
            ExamMediaService media,
            ExamStructureValidator validator,
            PlatformTransactionManager transactions,
            @Value("${app.exam-import.backend-dir:.}") String backendDirectory) {
        var formulas = new PdfFormulaProcessor(PdfFormulaProcessor.Configuration.local(Path.of(backendDirectory)));
        save = new SaveDependencies(exams, media, validator, new TransactionTemplate(transactions),
                formulas::checkLatex);
    }

    void configureSave(SaveDependencies dependencies) {
        save = dependencies;
    }

    @Value("${app.exam-import.enabled:true}")
    private boolean enabled = true;

    @org.springframework.beans.factory.annotation.Autowired
    public PdfExamImportService(
            PdfExamImportRepository jobs,
            UserRepository users,
            @Value("${app.exam-import.private-dir:.private/exam-imports}") String privateDirectory,
            @Value("${app.storage.local-dir:uploads}") String publicDirectory,
            @Value("${app.exam-import.backend-dir:.}") String backendDirectory) {
        this(jobs, users,
                new PdfImportFiles(Path.of(privateDirectory), Path.of(publicDirectory)),
                new PdfExamImportPipeline(new PdfFormulaProcessor(
                        PdfFormulaProcessor.Configuration.local(Path.of(backendDirectory)))));
    }

    PdfExamImportService(
            PdfExamImportRepository jobs,
            UserRepository users,
            PdfImportFiles files,
            PdfExamImportPipeline pipeline) {
        this.jobs = jobs;
        this.users = users;
        this.files = files;
        this.pipeline = pipeline;
    }

    public PdfExamImportResponse upload(
            String username, MultipartFile file, int examNumber, UUID requestId) {
        long ownerId = teacher(username);
        if (!enabled) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Chức năng import PDF đang tạm dừng");
        }
        if (examNumber < 1 || requestId == null || file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cần file PDF, số đề dương và requestId UUID");
        }
        byte[] bytes = readPdf(file);
        UUID candidate = UUID.randomUUID();
        try {
            files.write(files.source(candidate), bytes);
            Job job;
            try {
                job = jobs.reserve(candidate, ownerId, requestId, hash(bytes),
                        bytes.length, examNumber, now());
            } catch (ConflictException | ResponseStatusException rejected) {
                files.deleteJob(candidate);
                throw rejected;
            }
            if (!job.id().equals(candidate)) {
                files.deleteJob(candidate);
            }
            return response(job, false);
        } catch (IOException error) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Không lưu được file import riêng tư");
        }
    }

    public PdfExamImportResponse get(String username, UUID importId) {
        return response(owned(username, importId), true);
    }

    public PdfExamImportResponse cancel(String username, UUID importId) {
        long ownerId = teacher(username);
        var job = jobs.owned(importId, ownerId).orElseThrow(this::missing);
        if ("CANCELLED".equals(job.status())) {
            return response(job, false);
        }
        if (!job.expiresAt().isAfter(now())) {
            throw new ConflictException("Job import đã hết hạn");
        }
        if (!List.of("QUEUED", "PROCESSING", "READY_FOR_REVIEW", "FAILED").contains(job.status())
                || job.savedResponse() != null) {
            throw new ConflictException("Job đã lưu thành đề hoặc không còn ở trạng thái có thể hủy");
        }
        if (!jobs.cancel(importId, ownerId, now())) {
            job = jobs.owned(importId, ownerId).orElseThrow(this::missing);
            if (!"CANCELLED".equals(job.status())) {
                throw new ConflictException("Job đã đổi trạng thái và không thể hủy");
            }
        } else {
            job = jobs.owned(importId, ownerId).orElseThrow(this::missing);
        }
        return response(job, false);
    }

    public void requireReviewIfImport(CreateCompleteExamRequest request) {
        if (request.importReview() == null && request.draftToken() != null
                && jobs.isImportDraft(request.draftToken())) {
            throw new IllegalArgumentException("Bản nháp import cần xác nhận importReview trước khi lưu");
        }
    }

    /** Reviewed imports reuse the existing complete-exam persistence service. */
    public CreateExamResponse create(String username, CreateCompleteExamRequest request) {
        save.validator().validate(request);
        var review = request.importReview();
        if (review == null) throw new IllegalArgumentException("Thiếu thông tin duyệt import");
        var job = owned(username, review.importId());
        if (!job.draftToken().equals(request.draftToken())) {
            throw new IllegalArgumentException("draftToken không thuộc job import này");
        }
        String hash = hash(json.writeValueAsBytes(request));
        var lease = jobs.reserveSave(job.id(), job.ownerId(), hash, now());
        if (lease.previousResponse() != null) {
            return json.readValue(lease.previousResponse(), CreateExamResponse.class);
        }
        try {
            var preview = json.readValue(job.result(), Review.class);
            var mapper = new PdfExamReviewMapper(preview, request);
            // Validate conflicts between selected assets and manually uploaded media before storage IO.
            var placeholders = new LinkedHashMap<UUID, UUID>();
            review.illustrationAssetIds().forEach(id -> placeholders.put(id, id));
            mapper.attach(placeholders);
            checkReviewedLatex(request);
            var images = reviewedImages(job, preview, review.illustrationAssetIds());
            var uploaded = save.media().uploadGeneratedImages(username, job.draftToken(), images);
            var ids = new LinkedHashMap<UUID, UUID>();
            uploaded.forEach((sourceId, file) -> ids.put(sourceId, file.mediaId()));
            var prepared = mapper.attach(ids);
            save.validator().validate(prepared);

            // Row lock, existing exam/media persistence and replay receipt commit together.
            // Model inference and object uploads above never hold a DB transaction open.
            return save.transactions().execute(transaction -> {
                jobs.lockSave(job.id(), lease.token(), now());
                var created = save.exams().createCompleteExam(username, prepared);
                jobs.completeSave(job.id(), lease.token(), json.writeValueAsString(created));
                return created;
            });
        } finally {
            // Successful saves retain their receipt; failed uploads remain tracked by media TTL cleanup.
            try {
                jobs.releaseSave(job.id(), lease.token());
            } catch (RuntimeException cleanupError) {
                LOG.warn("Import save lease {} will be released by expiry", job.id());
            }
        }
    }

    private void checkReviewedLatex(CreateCompleteExamRequest request) {
        var formulas = PdfExamReviewMapper.formulas(request);
        if (formulas.isEmpty()) return;
        List<PdfFormulaProcessor.Check> checks;
        try {
            checks = save.checkLatex().apply(formulas);
        } catch (RuntimeException error) {
            throw new ConflictException("Chưa kiểm tra được LaTeX; giữ nội dung và thử lưu lại sau");
        }
        if (checks.size() != formulas.size() || checks.stream().anyMatch(check ->
                !"VALID".equals(check.syntaxStatus()) || !"VALID".equals(check.renderStatus()))) {
            throw new IllegalArgumentException("Công thức đã sửa còn lỗi cú pháp hoặc render; chưa lưu đề");
        }
    }

    private Map<UUID, byte[]> reviewedImages(Job job, Review preview, List<UUID> selected) {
        var result = new LinkedHashMap<UUID, byte[]>();
        var metadata = new LinkedHashMap<UUID, Media>();
        preview.media().forEach(asset -> metadata.put(asset.id(), asset));
        long total = 0;
        try {
            for (var id : selected) {
                var bytes = files.readAsset(job.id(), job.leaseToken(), id);
                total += bytes.length;
                if (total > 32L * 1024 * 1024 || !hash(bytes).equals(metadata.get(id).sourceImageHash())) {
                    throw new ConflictException("Ảnh preview đã thay đổi hoặc vượt giới hạn");
                }
                result.put(id, bytes);
            }
        } catch (IOException error) {
            throw new ConflictException("Không đọc được ảnh đã duyệt; preview có thể đã hết hạn");
        }
        return result;
    }

    public byte[] asset(String username, UUID importId, UUID assetId) {
        var job = jobs.ownedForAsset(importId, teacher(username)).orElseThrow(this::missing);
        if (!job.expiresAt().isAfter(now()) || !"READY_FOR_REVIEW".equals(job.status())) {
            throw missing();
        }
        // Only the committed generation is reachable. That directory contains only generated
        // UUID-named PNGs; incomplete or stale worker generations are never served.
        try {
            return files.readAsset(importId, job.leaseToken(), assetId);
        } catch (IOException error) {
            throw missing();
        }
    }

    private Job owned(String username, UUID importId) {
        return jobs.owned(importId, teacher(username)).orElseThrow(this::missing);
    }

    private long teacher(String username) {
        var user = users.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Tài khoản không tồn tại"));
        if (user.getRole() != UserRole.TEACHER || user.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalStateException("Chỉ giáo viên đang hoạt động được import đề");
        }
        return user.getId();
    }

    private byte[] readPdf(MultipartFile file) {
        if (file.getSize() > MAX_PDF_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "PDF tối đa 10 MiB");
        }
        try (var input = file.getInputStream()) {
            byte[] bytes = input.readNBytes(MAX_PDF_BYTES + 1);
            if (bytes.length > MAX_PDF_BYTES) {
                throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "PDF tối đa 10 MiB");
            }
            if (bytes.length < 5 || !new String(bytes, 0, 5, StandardCharsets.US_ASCII).equals("%PDF-")) {
                throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                        "File không có chữ ký PDF hợp lệ");
            }
            return bytes;
        } catch (IOException error) {
            throw new IllegalArgumentException("Không đọc được file upload");
        }
    }

    private PdfExamImportResponse response(Job job, boolean includePreview) {
        boolean expired = !job.expiresAt().isAfter(now()) || "EXPIRED".equals(job.status());
        String status = expired ? "EXPIRED" : job.status();
        boolean ready = "READY_FOR_REVIEW".equals(status);
        boolean pending = "QUEUED".equals(status) || "PROCESSING".equals(status);
        return new PdfExamImportResponse(
                job.id(), job.examNumber(), status, expired ? "EXPIRED" : job.stage(),
                pending ? 3000 : 0, ready ? job.draftToken() : null,
                job.createdAt().atOffset(ZoneOffset.UTC), job.updatedAt().atOffset(ZoneOffset.UTC),
                job.expiresAt().atOffset(ZoneOffset.UTC),
                job.errorCode(), job.errorMessage(),
                ready && includePreview ? json.readTree(job.result()) : null,
                job.savedResponse() == null ? null : json.readValue(job.savedResponse(), CreateExamResponse.class));
    }

    /** Called by the bounded worker, never by a GET or inside a long database transaction. */
    public void process(Job job) {
        try {
            var source = files.source(job.id());
            if (Files.size(source) != job.sourceSize()
                    || !hash(Files.readAllBytes(source)).equals(job.sourceHash())) {
                throw new IllegalArgumentException("File nguồn không khớp bản upload");
            }
            var preview = pipeline.process(source, job.examNumber(), PdfExamLayout.vietnameseThreePart(),
                    stage -> requireLease(job, stage.name()));
            var metadata = new ArrayList<Media>();
            requireLease(job, "BUILDING_PREVIEW");
            for (var asset : preview.media()) {
                if (Thread.currentThread().isInterrupted()) {
                    throw new IllegalStateException("Đã dừng ghi ảnh preview");
                }
                UUID assetId = UUID.randomUUID();
                files.write(files.asset(job.id(), job.leaseToken(), assetId), asset.png());
                metadata.add(new Media(
                        assetId, hash(asset.png()), asset.ownerId(), asset.owner(), asset.purpose(),
                        asset.sources(), asset.slices(), asset.width(), asset.height(), true, true,
                        "/api/exams/imports/" + job.id() + "/assets/" + assetId));
            }
            var payload = new Review(
                    preview.parserVersion(), preview.sourceHash(), preview.layoutId(),
                    preview.structure(), preview.answerEvidence(), metadata, preview.latex(), preview.counts());
            String encoded = json.writeValueAsString(payload);
            if (encoded.getBytes(StandardCharsets.UTF_8).length > MAX_PREVIEW_BYTES) {
                throw new IllegalArgumentException("Preview vượt giới hạn 4 MiB");
            }
            jobs.ready(job, encoded, now());
        } catch (PdfExamScopeParser.ScopeException error) {
            jobs.failed(job, error.code().name(), error.getMessage(), now());
        } catch (Exception error) {
            // Do not store stack traces, source text or filesystem paths in API errors/logs.
            jobs.failed(job, "IMPORT_PROCESSING_FAILED",
                    "Không tạo được preview; kiểm tra cấu trúc PDF hoặc thử lại với requestId mới", now());
        }
    }

    private void requireLease(Job job, String stage) {
        if (Thread.currentThread().isInterrupted() || !jobs.progress(job, stage, now())) {
            throw new IllegalStateException("Job không còn quyền ghi kết quả");
        }
    }

    public void cleanup() throws IOException {
        var now = now();
        jobs.expire(now);
        jobs.recover(now);
        var candidates = new ArrayList<UUID>();
        for (var directory : files.directories()) {
            UUID id;
            try {
                id = UUID.fromString(directory.getFileName().toString());
            } catch (IllegalArgumentException unknown) {
                continue;
            }
            if (Files.getLastModifiedTime(directory).toInstant()
                    .isBefore(now.minusHours(24).toInstant(ZoneOffset.UTC))) {
                candidates.add(id);
            }
        }
        var live = jobs.liveIds(candidates, now);
        for (var id : candidates) {
            if (!live.contains(id)) {
                files.deleteJob(id);
            }
        }
    }

    private ResourceNotFoundException missing() {
        return new ResourceNotFoundException("Không tìm thấy job hoặc ảnh preview");
    }

    static String hash(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException(impossible);
        }
    }

    static LocalDateTime now() {
        return LocalDateTime.now(ZoneOffset.UTC);
    }

    public record Media(
            UUID id,
            String sourceImageHash,
            String ownerId,
            PdfExamMediaExtractor.Owner owner,
            PdfExamMediaExtractor.Purpose purpose,
            List<PdfExamStructureParser.Region> sources,
            List<PdfExamMediaExtractor.SourceSlice> slices,
            int width,
            int height,
            boolean teacherOnly,
            boolean requiresReview,
            String url) {}

    public record Review(
            String parserVersion,
            String sourceHash,
            String layoutId,
            PdfExamStructureParser.Structure structure,
            List<PdfExamSolutionParser.Evidence> answerEvidence,
            List<Media> media,
            PdfFormulaProcessor.Result latex,
            PdfExamImportPipeline.Counts counts) {}
}
