package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.entity.enums.ExamMediaType;
import com.classmanagement.backend.exception.ExamMediaException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import static org.junit.jupiter.api.Assertions.*;

class ExamMediaValidatorTest {
    private final ExamMediaValidator validator = new ExamMediaValidator(1024 * 1024, 1024 * 1024, 100);

    @Test void acceptsRealPng() throws Exception {
        var result = validator.validate(ExamMediaType.IMAGE, png("image/png", "test.png", 2, 2));
        assertEquals("png", result.extension());
    }

    @Test void rejectsMimeSpoofing() throws Exception {
        assertThrows(IllegalArgumentException.class,
                () -> validator.validate(ExamMediaType.IMAGE, png("image/jpeg", "test.png", 2, 2)));
    }

    @Test void rejectsExtensionSpoofing() throws Exception {
        assertThrows(IllegalArgumentException.class,
                () -> validator.validate(ExamMediaType.IMAGE, png("image/png", "test.jpg", 2, 2)));
    }

    @Test void rejectsOversizedDimensions() {
        assertThrows(IllegalArgumentException.class,
                () -> validator.validate(ExamMediaType.IMAGE, png("image/png", "test.png", 11, 10)));
    }

    @Test void rejectsEmptyFile() {
        assertThrows(IllegalArgumentException.class, () -> validator.validate(ExamMediaType.IMAGE,
                new MockMultipartFile("file", "empty.png", "image/png", new byte[0])));
    }

    @Test void rejectsOversizedFileWith413() {
        var small = new ExamMediaValidator(10, 10, 100);
        var error = assertThrows(ExamMediaException.class, () -> small.validate(ExamMediaType.AUDIO,
                new MockMultipartFile("file", "large.mp3", "audio/mpeg", new byte[11])));
        assertEquals(413, error.getStatus().value());
    }

    @Test void rejectsTruncatedPngWithValidSignature() {
        byte[] header = {(byte)137,80,78,71,13,10,26,10};
        assertThrows(IllegalArgumentException.class, () -> validator.validate(ExamMediaType.IMAGE,
                new MockMultipartFile("file", "broken.png", "image/png", header)));
    }

    @Test void rejectsId3HeaderWithoutAudioFrames() {
        byte[] header = {'I','D','3',4,0,0,0,0,0,0};
        assertThrows(IllegalArgumentException.class, () -> validator.validate(ExamMediaType.AUDIO,
                new MockMultipartFile("file", "broken.mp3", "audio/mpeg", header)));
    }

    @Test void acceptsTwoCompleteMp3Frames() {
        byte[] frames = mp3Frames();
        assertEquals("mp3", validator.validate(ExamMediaType.AUDIO,
                new MockMultipartFile("file", "sample.mp3", "audio/mpeg", frames)).extension());
    }

    @Test void rejectsTruncatedSecondMp3Frame() {
        byte[] frames = java.util.Arrays.copyOf(mp3Frames(), 500);
        assertThrows(IllegalArgumentException.class, () -> validator.validate(ExamMediaType.AUDIO,
                new MockMultipartFile("file", "broken.mp3", "audio/mpeg", frames)));
    }

    @Test void rejectsUnsupportedAudio() {
        assertThrows(IllegalArgumentException.class, () -> validator.validate(ExamMediaType.AUDIO,
                new MockMultipartFile("file", "sample.m4a", "audio/mp4", mp3Frames())));
    }

    @Test void rejectsWebPWithoutImageChunk() {
        byte[] data = new byte[30];
        System.arraycopy("RIFF".getBytes(java.nio.charset.StandardCharsets.US_ASCII), 0, data, 0, 4);
        data[4] = 22;
        System.arraycopy("WEBP".getBytes(java.nio.charset.StandardCharsets.US_ASCII), 0, data, 8, 4);
        System.arraycopy("VP8X".getBytes(java.nio.charset.StandardCharsets.US_ASCII), 0, data, 12, 4);
        data[16] = 10;
        assertThrows(IllegalArgumentException.class, () -> validator.validate(ExamMediaType.IMAGE,
                new MockMultipartFile("file", "broken.webp", "image/webp", data)));
    }

    private MockMultipartFile png(String mime, String name, int width, int height) throws Exception {
        var output = new ByteArrayOutputStream();
        try (var imageOutput = new javax.imageio.stream.MemoryCacheImageOutputStream(output)) {
            ImageIO.write(new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB), "png", imageOutput);
        }
        return new MockMultipartFile("file", name, mime, output.toByteArray());
    }

    private byte[] mp3Frames() {
        byte[] data = new byte[834]; // MPEG1 layer III, 128kbps, 44100Hz: 417 bytes/frame.
        for (int offset : new int[]{0,417}) {
            data[offset] = (byte)255;
            data[offset+1] = (byte)251;
            data[offset+2] = (byte)144;
        }
        return data;
    }
}
