package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.entity.enums.ExamMediaType;
import com.classmanagement.backend.exception.ExamMediaException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.stream.MemoryCacheImageInputStream;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Objects;

@Component
public class ExamMediaValidator {
    private final long maxImageBytes;
    private final long maxAudioBytes;
    private final long maxImagePixels;

    public ExamMediaValidator(@Value("${app.exam-media.max-image-bytes:5242880}") long maxImageBytes,
            @Value("${app.exam-media.max-audio-bytes:8388608}") long maxAudioBytes,
            @Value("${app.exam-media.max-image-pixels:16000000}") long maxImagePixels) {
        if (maxImageBytes <= 0 || maxAudioBytes <= 0 || maxImagePixels <= 0) {
            throw new IllegalArgumentException("Giới hạn media phải lớn hơn 0");
        }
        this.maxImageBytes = maxImageBytes;
        this.maxAudioBytes = maxAudioBytes;
        this.maxImagePixels = maxImagePixels;
    }

    public ValidatedFile validate(ExamMediaType type, MultipartFile file) {
        if (type == null || file == null || file.isEmpty()) throw invalid();
        long limit = type == ExamMediaType.IMAGE ? maxImageBytes : maxAudioBytes;
        if (file.getSize() > limit) {
            throw new ExamMediaException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "Tệp vượt quá dung lượng cho phép: " + limit + " byte");
        }
        String name = Objects.toString(file.getOriginalFilename(), "").toLowerCase(Locale.ROOT);
        String extension = name.substring(name.lastIndexOf('.') + 1);
        String contentType = Objects.toString(file.getContentType(), "").toLowerCase(Locale.ROOT);
        try (InputStream input = file.getInputStream()) {
            // Bound the read independently of the client-reported size.
            byte[] data = input.readNBytes((int) Math.min(limit + 1, Integer.MAX_VALUE));
            if (data.length > limit) {
                throw new ExamMediaException(HttpStatus.PAYLOAD_TOO_LARGE, "Tệp vượt quá dung lượng cho phép");
            }
            if (data.length == 0 || data.length != file.getSize()) throw invalid();
            if (type == ExamMediaType.AUDIO) {
                if (!extension.equals("mp3") || !contentType.equals("audio/mpeg") || !isMp3(data)) {
                    throw new IllegalArgumentException("Audio hiện hỗ trợ MP3 hợp lệ với MIME audio/mpeg");
                }
                return new ValidatedFile("mp3", "audio/mpeg");
            }
            if ((extension.equals("jpg") || extension.equals("jpeg"))
                    && contentType.equals("image/jpeg") && data.length >= 3
                    && u(data[0]) == 255 && u(data[1]) == 216 && u(data[2]) == 255) {
                validateDecodedImage(data);
                return new ValidatedFile("jpg", "image/jpeg");
            }
            if (extension.equals("png") && contentType.equals("image/png")
                    && data.length >= 8 && u(data[0]) == 137 && text(data, 1, 3).equals("PNG")
                    && u(data[4]) == 13 && u(data[5]) == 10 && u(data[6]) == 26 && u(data[7]) == 10) {
                validateDecodedImage(data);
                return new ValidatedFile("png", "image/png");
            }
            if (extension.equals("webp") && contentType.equals("image/webp")) {
                validateWebP(data);
                return new ValidatedFile("webp", "image/webp");
            }
            throw invalid();
        } catch (IOException ex) {
            throw invalid();
        }
    }

    private void validateDecodedImage(byte[] data) throws IOException {
        try (var input = new MemoryCacheImageInputStream(new ByteArrayInputStream(data))) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw invalid();
            var reader = readers.next();
            try {
                reader.setInput(input, true, true);
                validateDimensions(reader.getWidth(0), reader.getHeight(0));
                if (reader.read(0) == null) throw invalid();
            } finally {
                reader.dispose();
            }
        }
    }

    private void validateWebP(byte[] data) {
        if (data.length < 30 || !text(data, 0, 4).equals("RIFF")
                || !text(data, 8, 4).equals("WEBP") || little(data, 4, 4) + 8 != data.length) throw invalid();
        boolean imageFound = false;
        int cursor = 12;
        while (cursor < data.length) {
            if (cursor + 8 > data.length) throw invalid();
            String chunk = text(data, cursor, 4);
            long length = little(data, cursor + 4, 4);
            int start = cursor + 8;
            long end = start + length + (length & 1);
            if (end > data.length) throw invalid();
            if (chunk.equals("VP8X")) {
                if (length != 10 || (u(data[start]) & 2) != 0) throw invalid(); // Reject animation.
                validateDimensions(little(data, start + 4, 3) + 1, little(data, start + 7, 3) + 1);
            } else if (chunk.equals("VP8 ")) {
                if (length < 10 || (u(data[start]) & 1) != 0 || u(data[start + 3]) != 157
                        || u(data[start + 4]) != 1 || u(data[start + 5]) != 42) throw invalid();
                validateDimensions(little(data, start + 6, 2) & 16383, little(data, start + 8, 2) & 16383);
                imageFound = true;
            } else if (chunk.equals("VP8L")) {
                if (length < 5 || u(data[start]) != 47) throw invalid();
                long bits = little(data, start + 1, 4);
                if ((bits >>> 29) != 0) throw invalid();
                validateDimensions((bits & 16383) + 1, ((bits >>> 14) & 16383) + 1);
                imageFound = true;
            }
            cursor = (int) end;
        }
        if (!imageFound) throw invalid();
    }

    private void validateDimensions(long width, long height) {
        if (width <= 0 || height <= 0 || width * height > maxImagePixels) {
            throw new IllegalArgumentException("Kích thước ảnh không hợp lệ hoặc vượt giới hạn pixel");
        }
    }

    private boolean isMp3(byte[] data) {
        int start = 0;
        if (data.length >= 10 && text(data, 0, 3).equals("ID3")) {
            if (u(data[3]) < 2 || u(data[3]) > 4) return false;
            for (int i = 6; i < 10; i++) if ((u(data[i]) & 128) != 0) return false;
            start = 10 + (u(data[6]) << 21) + (u(data[7]) << 14) + (u(data[8]) << 7) + u(data[9]);
            if (u(data[3]) == 4 && (u(data[5]) & 16) != 0) start += 10;
        }
        int firstLength = mp3FrameLength(data, start);
        if (firstLength == 0 || start + firstLength > data.length - 4) return false;
        int secondLength = mp3FrameLength(data, start + firstLength);
        return secondLength > 0 && start + firstLength + secondLength <= data.length;
    }

    private int mp3FrameLength(byte[] data, int offset) {
        if (offset < 0 || offset > data.length - 4 || u(data[offset]) != 255
                || (u(data[offset + 1]) & 224) != 224) return 0;
        int version = (u(data[offset + 1]) >>> 3) & 3;
        int layer = (u(data[offset + 1]) >>> 1) & 3;
        int bitrateIndex = u(data[offset + 2]) >>> 4;
        int sampleIndex = (u(data[offset + 2]) >>> 2) & 3;
        if (version == 1 || layer != 1 || bitrateIndex == 0 || bitrateIndex == 15 || sampleIndex == 3) return 0;
        int[] mpeg1 = {0,32,40,48,56,64,80,96,112,128,160,192,224,256,320};
        int[] mpeg2 = {0,8,16,24,32,40,48,56,64,80,96,112,128,144,160};
        int[] samples = {44100,48000,32000};
        int sampleRate = samples[sampleIndex] / (version == 3 ? 1 : version == 2 ? 2 : 4);
        return (version == 3 ? 144000 : 72000) * (version == 3 ? mpeg1[bitrateIndex] : mpeg2[bitrateIndex])
                / sampleRate + ((u(data[offset + 2]) >>> 1) & 1);
    }

    private static int u(byte value) { return value & 255; }
    private static String text(byte[] data, int offset, int length) {
        return new String(data, offset, length, StandardCharsets.US_ASCII);
    }
    private static long little(byte[] data, int offset, int length) {
        long result = 0;
        for (int i = 0; i < length; i++) result |= (long) u(data[offset + i]) << (8 * i);
        return result;
    }
    private static IllegalArgumentException invalid() {
        return new IllegalArgumentException("Tệp ảnh/audio không hợp lệ hoặc định dạng không được hỗ trợ");
    }
    public record ValidatedFile(String extension, String contentType) {}
}
