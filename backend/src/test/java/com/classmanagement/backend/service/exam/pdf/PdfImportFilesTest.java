package com.classmanagement.backend.service.exam.pdf;

import static org.junit.jupiter.api.Assertions.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class PdfImportFilesTest {
    @TempDir
    Path temporary;

    @Test
    void rejectsAnyOverlapWithPublicUploads() {
        var uploads = temporary.resolve("uploads");
        assertThrows(IllegalArgumentException.class,
                () -> new PdfImportFiles(uploads.resolve("private"), uploads));
        assertThrows(IllegalArgumentException.class,
                () -> new PdfImportFiles(temporary, uploads));
        assertThrows(IllegalArgumentException.class,
                () -> new PdfImportFiles(uploads, uploads));
    }

    @Test
    void keepsCleanupInsideOneJobAndRefusesOverwriteOrExternalWrites() throws Exception {
        var files = new PdfImportFiles(temporary.resolve("private"), temporary.resolve("uploads"));
        UUID first = UUID.randomUUID();
        UUID second = UUID.randomUUID();
        files.write(files.source(first), new byte[] {1});
        files.write(files.source(second), new byte[] {2});
        assertThrows(java.nio.file.FileAlreadyExistsException.class,
                () -> files.write(files.source(first), new byte[] {9}));
        assertThrows(IllegalArgumentException.class,
                () -> files.write(temporary.resolve("outside"), new byte[] {9}));
        files.deleteJob(first);
        assertFalse(Files.exists(files.source(first)));
        assertArrayEquals(new byte[] {2}, Files.readAllBytes(files.source(second)));
    }

    @Test
    void separatesAssetsByLeaseGeneration() throws Exception {
        var files = new PdfImportFiles(temporary.resolve("private"), temporary.resolve("uploads"));
        UUID job = UUID.randomUUID();
        UUID generation = UUID.randomUUID();
        UUID asset = UUID.randomUUID();
        files.write(files.asset(job, generation, asset), new byte[] {1, 2});
        assertArrayEquals(new byte[] {1, 2}, files.readAsset(job, generation, asset));
        assertThrows(java.nio.file.NoSuchFileException.class,
                () -> files.readAsset(job, UUID.randomUUID(), asset));
    }
}
