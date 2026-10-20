package com.classmanagement.backend.service.impl;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class LocalStorageServiceTest {

    @TempDir
    Path storageRoot;

    @Test
    void deletingMaterialFileRemovesEmptyMaterialFoldersOnly() throws Exception {
        Path teacherFolder = storageRoot.resolve("materials/teachers/17");
        Path firstMaterialFolder = teacherFolder.resolve("first-upload");
        Path secondMaterialFolder = teacherFolder.resolve("second-upload");
        Files.createDirectories(firstMaterialFolder);
        Files.createDirectories(secondMaterialFolder);
        Files.writeString(firstMaterialFolder.resolve("document.pdf"), "first");
        Files.writeString(secondMaterialFolder.resolve("document.docx"), "second");

        LocalStorageService storage = new LocalStorageService();
        Field localDir = LocalStorageService.class.getDeclaredField("localDir");
        localDir.setAccessible(true);
        localDir.set(storage, storageRoot.toString());

        storage.delete("materials/teachers/17/first-upload/document.pdf");

        assertFalse(Files.exists(firstMaterialFolder));
        assertTrue(Files.exists(secondMaterialFolder.resolve("document.docx")));
        assertTrue(Files.isDirectory(teacherFolder));

        storage.delete("materials/teachers/17/second-upload/document.docx");

        assertFalse(Files.exists(teacherFolder));
        assertTrue(Files.isDirectory(storageRoot.resolve("materials/teachers")));
    }
}
