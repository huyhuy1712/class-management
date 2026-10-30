package com.classmanagement.backend.service.homework.files;

import com.classmanagement.backend.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HomeworkFileService {
    public static final int MAX_IMAGES = 5;
    public static final int MAX_SUBMISSION_FILES = 5;
    private static final long MAX_PROMPT_FILE_SIZE = 10L * 1024 * 1024;
    private static final long MAX_AUDIO_SIZE = 10L * 1024 * 1024;
    private static final long MAX_IMAGE_SIZE = 5L * 1024 * 1024;
    private static final long MAX_SUBMISSION_FILE_SIZE = 10L * 1024 * 1024;
    private static final Set<String> PROMPT_EXTENSIONS = Set.of("pdf", "doc", "docx", "jpg", "jpeg", "png");
    private static final Set<String> IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png");
    private static final Set<String> AUDIO_EXTENSIONS = Set.of("mp3", "wav", "m4a", "aac", "ogg", "webm");
    private static final Set<String> SUBMISSION_FILE_EXTENSIONS = Set.of(
            "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "zip", "rar", "csv");

    private final StorageService storage;

    public UploadedFile uploadPrompt(Long teacherId, MultipartFile file) {
        String extension = extension(file.getOriginalFilename());
        if (!PROMPT_EXTENSIONS.contains(extension))
            throw new IllegalArgumentException("Tệp bài tập chỉ hỗ trợ PDF, DOC, DOCX, JPG hoặc PNG");
        if (file.getSize() > MAX_PROMPT_FILE_SIZE)
            throw new IllegalArgumentException("Tệp bài tập không được vượt quá 10 MB");
        String name = safeName(file.getOriginalFilename());
        String type = contentType(extension);
        String path = storage.upload("homework/teachers/" + teacherId + "/" + UUID.randomUUID(),
                "prompt." + extension, typed(file, type));
        return new UploadedFile(path, name, type, file.getSize());
    }

    public UploadedFile uploadAudio(String directory, String storedName, MultipartFile file) {
        String extension = extension(file.getOriginalFilename());
        if (!AUDIO_EXTENSIONS.contains(extension))
            throw new IllegalArgumentException("Tệp âm thanh chỉ hỗ trợ MP3, WAV, M4A, AAC, OGG hoặc WEBM");
        if (file.getSize() > MAX_AUDIO_SIZE)
            throw new IllegalArgumentException("Tệp âm thanh không được vượt quá 10 MB");
        String name = safeName(file.getOriginalFilename());
        String type = contentType(extension);
        String path = storage.upload(directory + "/" + UUID.randomUUID(),
                storedName + "." + extension, typed(file, type));
        return new UploadedFile(path, name, type, file.getSize());
    }

    public List<UploadedFile> uploadImages(long assignmentId, Long studentId, List<MultipartFile> images) {
        List<UploadedFile> uploaded = new ArrayList<>();
        try {
            for (MultipartFile image : images) {
                String extension = extension(image.getOriginalFilename());
                if (!IMAGE_EXTENSIONS.contains(extension))
                    throw new IllegalArgumentException("Ảnh bài làm chỉ hỗ trợ JPG hoặc PNG");
                if (image.getSize() > MAX_IMAGE_SIZE)
                    throw new IllegalArgumentException("Mỗi ảnh bài làm không được vượt quá 5 MB");
                String type = contentType(extension);
                String path = storage.upload(
                        "homework/submissions/" + assignmentId + "/" + studentId + "/" + UUID.randomUUID(),
                        "answer." + extension, typed(image, type));
                uploaded.add(new UploadedFile(path, safeName(image.getOriginalFilename()), type, image.getSize()));
            }
            return uploaded;
        } catch (RuntimeException error) {
            uploaded.forEach(item -> deleteUploaded(item, error));
            throw error;
        }
    }

    public List<UploadedFile> uploadSubmissionFiles(long assignmentId, Long studentId, List<MultipartFile> files) {
        List<UploadedFile> uploaded = new ArrayList<>();
        try {
            for (MultipartFile file : files) {
                String extension = extension(file.getOriginalFilename());
                if (!SUBMISSION_FILE_EXTENSIONS.contains(extension))
                    throw new IllegalArgumentException("File bài làm chỉ hỗ trợ PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP, RAR hoặc CSV");
                if (file.getSize() > MAX_SUBMISSION_FILE_SIZE)
                    throw new IllegalArgumentException("Mỗi file bài làm không được vượt quá 10 MB");
                String type = contentType(extension);
                String path = storage.upload(
                        "homework/submissions/" + assignmentId + "/" + studentId + "/" + UUID.randomUUID(),
                        "answer-file." + extension, typed(file, type));
                uploaded.add(new UploadedFile(path, safeName(file.getOriginalFilename()), type, file.getSize()));
            }
            return uploaded;
        } catch (RuntimeException error) {
            uploaded.forEach(item -> deleteUploaded(item, error));
            throw error;
        }
    }

    public void deleteUploaded(UploadedFile file, RuntimeException original) {
        if (file == null) return;
        try {
            storage.delete(file.path());
        } catch (RuntimeException cleanupError) {
            original.addSuppressed(cleanupError);
        }
    }

    public void delete(String objectPath) {
        storage.delete(objectPath);
    }

    private static MultipartFile typed(MultipartFile file, String contentType) {
        return new TypedMultipartFile(file, contentType);
    }

    private static String extension(String filename) {
        String base = filename == null ? "" : filename.replace('\\', '/');
        int dot = base.lastIndexOf('.');
        return dot < base.lastIndexOf('/') ? "" : base.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private static String safeName(String filename) {
        String base = filename == null ? "file" : filename.replace('\\', '/');
        String name = base.substring(base.lastIndexOf('/') + 1).trim();
        if (name.isEmpty() || name.length() > 255)
            throw new IllegalArgumentException("Tên tệp không hợp lệ hoặc vượt quá 255 ký tự");
        return name;
    }

    private static String contentType(String extension) {
        return switch (extension) {
            case "pdf" -> "application/pdf";
            case "doc" -> "application/msword";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "xls" -> "application/vnd.ms-excel";
            case "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case "ppt" -> "application/vnd.ms-powerpoint";
            case "pptx" -> "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            case "txt" -> "text/plain";
            case "csv" -> "text/csv";
            case "zip" -> "application/zip";
            case "rar" -> "application/vnd.rar";
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            case "mp3" -> "audio/mpeg";
            case "wav" -> "audio/wav";
            case "m4a" -> "audio/mp4";
            case "aac" -> "audio/aac";
            case "ogg" -> "audio/ogg";
            case "webm" -> "audio/webm";
            default -> "application/octet-stream";
        };
    }

    public record UploadedFile(String path, String name, String contentType, long size) {}

    private record TypedMultipartFile(MultipartFile delegate, String contentType) implements MultipartFile {
        @Override public String getName() { return delegate.getName(); }
        @Override public String getOriginalFilename() { return delegate.getOriginalFilename(); }
        @Override public String getContentType() { return contentType; }
        @Override public boolean isEmpty() { return delegate.isEmpty(); }
        @Override public long getSize() { return delegate.getSize(); }
        @Override public byte[] getBytes() throws IOException { return delegate.getBytes(); }
        @Override public InputStream getInputStream() throws IOException { return delegate.getInputStream(); }
        @Override public void transferTo(File destination) throws IOException, IllegalStateException {
            delegate.transferTo(destination);
        }
    }
}
