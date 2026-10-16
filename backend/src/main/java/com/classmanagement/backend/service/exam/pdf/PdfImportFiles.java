package com.classmanagement.backend.service.exam.pdf;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/** Private local files, deliberately separate from the public StorageService. */
final class PdfImportFiles {
    private final Path root;

    PdfImportFiles(Path privateRoot, Path publicRoot) {
        root = canonical(privateRoot);
        var uploads = canonical(publicRoot);
        if (root.startsWith(uploads) || uploads.startsWith(root)) {
            throw new IllegalArgumentException("Thư mục import phải tách biệt thư mục uploads công khai");
        }
    }

    private static Path canonical(Path input) {
        var absolute = input.toAbsolutePath().normalize();
        var existing = absolute;
        try {
            while (!Files.exists(existing, LinkOption.NOFOLLOW_LINKS)) {
                existing = existing.getParent();
            }
            return existing.toRealPath().resolve(existing.relativize(absolute)).normalize();
        } catch (IOException error) {
            throw new IllegalStateException("Không xác định được thư mục import riêng tư", error);
        }
    }

    Path source(UUID jobId) {
        return checked(root.resolve(jobId.toString()).resolve("source.pdf"));
    }

    Path asset(UUID jobId, UUID generation, UUID assetId) {
        return checked(root.resolve(jobId.toString()).resolve(generation.toString())
                .resolve(assetId + ".png"));
    }

    void write(Path path, byte[] bytes) throws IOException {
        checked(path);
        Files.createDirectories(path.getParent());
        checked(path);
        Files.write(path, bytes, java.nio.file.StandardOpenOption.CREATE_NEW);
    }

    byte[] readAsset(UUID jobId, UUID generation, UUID assetId) throws IOException {
        var path = asset(jobId, generation, assetId);
        if (Files.size(path) > 5L * 1024 * 1024) {
            throw new IOException("Private asset exceeds size limit");
        }
        return Files.readAllBytes(path);
    }

    List<Path> directories() throws IOException {
        if (!Files.exists(root)) {
            return List.of();
        }
        checked(root);
        try (var paths = Files.list(root)) {
            // Oldest first prevents old failed uploads being starved by newer directories.
            return paths.filter(path -> Files.isDirectory(path, LinkOption.NOFOLLOW_LINKS))
                    .sorted(Comparator.comparingLong(path -> path.toFile().lastModified()))
                    .limit(1000)
                    .toList();
        }
    }

    void deleteJob(UUID jobId) throws IOException {
        var directory = checked(root.resolve(jobId.toString()));
        if (!Files.exists(directory, LinkOption.NOFOLLOW_LINKS)) {
            return;
        }
        // Target is exactly root/<UUID>; walk does not follow links.
        try (var paths = Files.walk(directory)) {
            for (var path : paths.sorted(Comparator.reverseOrder()).toList()) {
                checked(path);
                Files.deleteIfExists(path);
            }
        }
    }

    private Path checked(Path path) {
        var normalized = path.toAbsolutePath().normalize();
        if (!normalized.startsWith(root)) {
            throw new IllegalArgumentException("Đường dẫn import không hợp lệ");
        }
        // No symlinks in root, ancestors, job or asset paths, even after startup.
        for (Path part = normalized; part != null; part = part.getParent()) {
            if (Files.isSymbolicLink(part)) {
                throw new IllegalArgumentException("Không hỗ trợ symlink trong thư mục import");
            }
        }
        return normalized;
    }
}
