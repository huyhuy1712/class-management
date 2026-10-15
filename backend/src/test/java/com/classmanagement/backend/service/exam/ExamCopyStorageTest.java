package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.service.impl.LocalStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.util.ReflectionTestUtils;
import java.nio.file.*;
import static org.junit.jupiter.api.Assertions.*;

class ExamCopyStorageTest {
    @TempDir Path directory;
    @Test void deletingCopyCannotDeleteSourceAndPathsStayInsideStorage() throws Exception {
        var storage = new LocalStorageService();
        ReflectionTestUtils.setField(storage, "localDir", directory.toString());
        Files.writeString(directory.resolve("source.png"), "image");
        storage.copy("source.png", "copy/new.png");
        assertEquals("image", Files.readString(directory.resolve("copy/new.png")));
        storage.delete("copy/new.png");
        assertEquals("image", Files.readString(directory.resolve("source.png")));
        assertThrows(IllegalArgumentException.class, () -> storage.copy("source.png", "../outside.png"));
        assertThrows(IllegalArgumentException.class, () -> storage.copy("../outside.png", "copy/new.png"));
        assertThrows(IllegalArgumentException.class, () -> storage.copy("source.png", "source.png"));
    }
}
