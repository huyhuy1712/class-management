package com.classmanagement.backend.service.exam.pdf.latex;

import com.classmanagement.backend.service.exam.pdf.PdfExamMediaExtractor.Asset;
import com.classmanagement.backend.service.exam.pdf.PdfExamMediaExtractor.Owner;
import com.classmanagement.backend.service.exam.pdf.PdfExamMediaExtractor.Purpose;
import com.classmanagement.backend.service.exam.pdf.PdfExamMediaExtractor.SourceSlice;
import com.classmanagement.backend.service.exam.pdf.PdfExamScopeParser.Range;
import com.classmanagement.backend.service.exam.pdf.PdfExamScopeParser.Position;
import com.classmanagement.backend.service.exam.pdf.PdfExamScopeParser.TextBox;
import com.classmanagement.backend.service.exam.pdf.PdfExamStructureParser.Issue;
import com.classmanagement.backend.service.exam.pdf.PdfExamStructureParser.Region;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import tools.jackson.databind.JsonNode;

/** Local recognition and render validation. Neither OCR nor rendering proves source equivalence. */
public final class PdfFormulaProcessor {
    public record Configuration(
            String python,
            String node,
            Path toolsDirectory,
            Path modelsDirectory,
            Duration recognitionTimeout) {
        public Configuration {
            Objects.requireNonNull(python);
            Objects.requireNonNull(node);
            toolsDirectory = toolsDirectory.toAbsolutePath().normalize();
            modelsDirectory = modelsDirectory.toAbsolutePath().normalize();
            if (recognitionTimeout.isNegative() || recognitionTimeout.isZero()
                    || recognitionTimeout.compareTo(Duration.ofMinutes(15)) > 0) {
                throw new IllegalArgumentException("Timeout nhận dạng phải từ 1 ms đến 15 phút");
            }
        }

        public static Configuration local(Path backend) {
            var executable = System.getProperty("os.name").startsWith("Windows")
                    ? ".venv-formula/Scripts/python.exe"
                    : ".venv-formula/bin/python";
            return new Configuration(
                    backend.resolve(executable).toAbsolutePath().toString(),
                    "node",
                    backend.resolve("tools/formula"),
                    backend.resolve("formula-models"),
                    Duration.ofMinutes(10));
        }
    }

    public record Formula(
            String id,
            String ownerId,
            Owner owner,
            Region source,
            String sourceImageHash,
            TextBox sourcePixels,
            String recognizedLatex,
            String syntaxStatus,
            String renderStatus,
            boolean reviewRequired) {}

    public record Check(String id, String syntaxStatus, String renderStatus) {}

    public record Result(
            List<Formula> formulas,
            List<Issue> issues,
            String recognizerVersion,
            boolean latexChecked) {
        public Result {
            formulas = List.copyOf(formulas);
            issues = List.copyOf(issues);
        }
    }

    private record Recognized(String imageId, TextBox box, String latex) {}

    private final Configuration configuration;
    private final LocalFormulaProcess process = new LocalFormulaProcess();

    public PdfFormulaProcessor(Configuration configuration) {
        this.configuration = Objects.requireNonNull(configuration);
    }

    public Result recognize(List<Asset> media) {
        var images = groupSources(media);
        var formulas = new ArrayList<Formula>();
        var issues = new ArrayList<Issue>();
        if (images.isEmpty()) {
            return new Result(formulas, issues, "NOT_RUN", false);
        }

        // Even zero detections requires whole-source review: a detector can miss a formula.
        images.values().stream().flatMap(List::stream).forEach(asset -> issues.add(new Issue(
                "FORMULA_SOURCE_REVIEW_REQUIRED", "BLOCKING", asset.ownerId(),
                "Cần đối chiếu toàn bộ ảnh nguồn, gồm công thức có thể chưa được phát hiện",
                range(asset.sources().getFirst()))));

        Path temporary = null;
        try {
            temporary = Files.createTempDirectory("exam-formulas-");
            var requests = new ArrayList<Map<String, Object>>();
            for (var entry : images.entrySet()) {
                var file = temporary.resolve(entry.getKey() + ".png");
                Files.write(file, entry.getValue().getFirst().png());
                requests.add(Map.of(
                        "id", entry.getKey(),
                        "path", file.toString(),
                        "slices", entry.getValue().getFirst().slices().stream()
                                .map(slice -> Map.of("top", slice.top(), "width", slice.width(),
                                        "height", slice.height()))
                                .toList()));
            }

            var response = process.run(
                    List.of(configuration.python(), script("recognize.py"),
                            "--models", configuration.modelsDirectory().toString()),
                    Map.of("images", requests), configuration.recognitionTimeout(),
                    configuration.toolsDirectory());
            String version = requiredText(response, "version", 128);
            var recognized = parseResponse(response, images);
            var checks = checkLatex(recognized.stream().map(Recognized::latex).toList());
            for (int i = 0; i < recognized.size(); i++) {
                var candidate = recognized.get(i);
                var check = checks.get(i);
                for (var asset : images.get(candidate.imageId())) {
                    var source = mapSource(asset, candidate.box());
                    if (source == null) {
                        issues.add(new Issue("FORMULA_SOURCE_BOUNDARY_UNCERTAIN", "BLOCKING",
                                asset.ownerId(), "Vùng công thức vượt một trang hoặc nằm trên khoảng ghép ảnh",
                                range(asset.sources().getFirst())));
                        continue;
                    }
                    String id = digest((asset.ownerId() + asset.owner() + candidate.imageId()
                            + source + candidate.box() + candidate.latex()).getBytes(java.nio.charset.StandardCharsets.UTF_8));
                    formulas.add(new Formula(id, asset.ownerId(), asset.owner(), source,
                            candidate.imageId(), candidate.box(), candidate.latex(),
                            check.syntaxStatus(), check.renderStatus(), true));
                    if (!"VALID".equals(check.syntaxStatus()) || !"VALID".equals(check.renderStatus())) {
                        issues.add(new Issue("FORMULA_LATEX_INVALID", "BLOCKING", asset.ownerId(),
                                "Công thức chưa qua kiểm tra cú pháp/render", range(source)));
                    }
                }
            }
            return new Result(formulas, issues, version, false);
        } catch (LocalFormulaProcess.Failure e) {
            images.values().stream().flatMap(List::stream).forEach(asset -> issues.add(new Issue(
                    e.code(), "BLOCKING", asset.ownerId(),
                    "Bộ nhận dạng/render tại máy chưa chạy được; giữ ảnh nguồn để kiểm tra",
                    range(asset.sources().getFirst()))));
            return new Result(List.of(), issues, "UNAVAILABLE", false);
        } catch (IOException e) {
            throw new IllegalStateException("Không chuẩn bị được vùng ảnh công thức riêng tư", e);
        } finally {
            deleteTemporary(temporary);
        }
    }

    /** Re-run after a teacher edits LaTeX. VALID still requires explicit source review. */
    public List<Check> checkLatex(List<String> latex) {
        if (latex.size() > 1000 || latex.stream().anyMatch(s -> s == null || s.length() > 4096)) {
            throw new IllegalArgumentException("Vượt giới hạn công thức");
        }
        if (latex.isEmpty()) return List.of();
        var request = new ArrayList<Map<String, String>>();
        for (int i = 0; i < latex.size(); i++) {
            request.add(Map.of("id", Integer.toString(i), "latex", latex.get(i)));
        }
        var response = process.run(List.of(configuration.node(), script("latex_check.mjs")),
                Map.of("formulas", request), Duration.ofSeconds(30), configuration.toolsDirectory());
        var rows = response.get("results");
        if (rows == null || !rows.isArray() || rows.size() != latex.size()) {
            throw new LocalFormulaProcess.Failure("LOCAL_FORMULA_INVALID_RESPONSE");
        }
        var checks = new ArrayList<Check>();
        for (int i = 0; i < rows.size(); i++) {
            var row = rows.get(i);
            String id = requiredText(row, "id", 12);
            String syntax = requiredText(row, "syntax", 16);
            String render = requiredText(row, "render", 16);
            if (!id.equals(Integer.toString(i)) || !List.of("VALID", "INVALID").contains(syntax)
                    || !List.of("VALID", "FAILED", "NOT_RUN").contains(render)) {
                throw new LocalFormulaProcess.Failure("LOCAL_FORMULA_INVALID_RESPONSE");
            }
            checks.add(new Check(id, syntax, render));
        }
        return List.copyOf(checks);
    }

    private Map<String, List<Asset>> groupSources(List<Asset> media) {
        var images = new LinkedHashMap<String, List<Asset>>();
        long totalBytes = 0;
        for (var asset : media) {
            if (asset.purpose() != Purpose.SOURCE_REFERENCE) continue;
            byte[] png = asset.png();
            totalBytes += png.length;
            if (!asset.teacherOnly() || asset.sources().isEmpty() || asset.slices().isEmpty()
                    || png.length > 5 * 1024 * 1024 || totalBytes > 32 * 1024 * 1024
                    || images.size() >= 150) {
                throw new IllegalArgumentException("Vùng nguồn công thức không hợp lệ hoặc vượt giới hạn");
            }
            images.computeIfAbsent(digest(png), key -> new ArrayList<>()).add(asset);
        }
        return images;
    }

    private List<Recognized> parseResponse(JsonNode response, Map<String, List<Asset>> images) {
        var rows = response.get("formulas");
        if (rows == null || !rows.isArray() || rows.size() > 1000) {
            throw new LocalFormulaProcess.Failure("LOCAL_FORMULA_INVALID_RESPONSE");
        }
        var results = new ArrayList<Recognized>();
        for (var row : rows) {
            String imageId = requiredText(row, "imageId", 64);
            var box = row.get("box");
            if (!images.containsKey(imageId) || box == null || !box.isArray() || box.size() != 4) {
                throw new LocalFormulaProcess.Failure("LOCAL_FORMULA_INVALID_RESPONSE");
            }
            for (var value : box) {
                if (!value.isNumber() || !Double.isFinite(value.asDouble())) {
                    throw new LocalFormulaProcess.Failure("LOCAL_FORMULA_INVALID_RESPONSE");
                }
            }
            var pixels = new TextBox(box.get(0).asInt(), box.get(1).asInt(), box.get(2).asInt(), box.get(3).asInt());
            var asset = images.get(imageId).getFirst();
            if (pixels.left() < 0 || pixels.top() < 0 || pixels.right() > asset.width()
                    || pixels.bottom() > asset.height() || pixels.right() <= pixels.left()
                    || pixels.bottom() <= pixels.top()) {
                throw new LocalFormulaProcess.Failure("LOCAL_FORMULA_INVALID_RESPONSE");
            }
            var latex = row.get("latex");
            if (latex == null || !latex.isString() || latex.asString().length() > 4096) {
                throw new LocalFormulaProcess.Failure("LOCAL_FORMULA_INVALID_RESPONSE");
            }
            // An empty OCR result is an unresolved formula, not a malformed whole batch.
            results.add(new Recognized(imageId, pixels, latex.asString()));
        }
        return results;
    }

    static Region mapSource(Asset asset, TextBox pixels) {
        var matches = asset.slices().stream().filter(slice -> pixels.left() >= 0
                && pixels.right() <= slice.width() && pixels.top() >= slice.top()
                && pixels.bottom() <= slice.top() + slice.height()).toList();
        if (matches.size() != 1) return null;
        SourceSlice slice = matches.getFirst();
        var source = slice.source().box();
        double xScale = (source.right() - source.left()) / slice.width();
        double yScale = (source.bottom() - source.top()) / slice.height();
        return new Region(slice.source().page(), new TextBox(
                (float) (source.left() + pixels.left() * xScale),
                (float) (source.top() + (pixels.top() - slice.top()) * yScale),
                (float) (source.left() + pixels.right() * xScale),
                (float) (source.top() + (pixels.bottom() - slice.top()) * yScale)));
    }

    private String script(String name) {
        return configuration.toolsDirectory().resolve(name).toString();
    }

    private static String requiredText(JsonNode node, String field, int limit) {
        var value = node == null ? null : node.get(field);
        if (value == null || !value.isString() || value.asString().isBlank()
                || value.asString().length() > limit) {
            throw new LocalFormulaProcess.Failure("LOCAL_FORMULA_INVALID_RESPONSE");
        }
        return value.asString();
    }

    private static Range range(Region region) {
        return new Range(new Position(region.page(), region.box().left(), region.box().top()),
                new Position(region.page(), region.box().right(), region.box().bottom()));
    }

    private static String digest(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static void deleteTemporary(Path directory) {
        if (directory == null) return;
        var root = directory.toAbsolutePath().normalize();
        if (!root.getFileName().toString().startsWith("exam-formulas-")) {
            throw new IllegalArgumentException("Không phải thư mục công thức tạm được tạo bởi BE");
        }
        try (var files = Files.walk(root)) {
            for (var file : files.sorted(Comparator.reverseOrder()).toList()) {
                if (!file.toAbsolutePath().normalize().startsWith(root)) {
                    throw new IllegalArgumentException("Đường dẫn xóa vượt thư mục công thức tạm");
                }
                Files.deleteIfExists(file);
            }
        } catch (IOException e) {
            throw new IllegalStateException("Không xóa được ảnh công thức tạm", e);
        }
    }
}
