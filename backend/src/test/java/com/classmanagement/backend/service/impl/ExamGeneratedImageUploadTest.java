package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.exception.ExamMediaException;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.exam.ExamMediaRepository;
import com.classmanagement.backend.service.StorageService;
import com.classmanagement.backend.service.exam.media.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.lang.reflect.Proxy;
import java.util.*;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.springframework.web.multipart.MultipartFile;
import static org.junit.jupiter.api.Assertions.*;

class ExamGeneratedImageUploadTest {
    private final List<String> calls=new ArrayList<>();
    private final User teacher=User.builder().id(1L).username("teacher").role(UserRole.TEACHER).status(UserStatus.ACTIVE).build();
    private ExamMedia media;private boolean failStorage;
    private final Map<UUID, ExamMedia> batchMedia = new HashMap<>();
    private int userReads;
    private int batchReads;
    @SuppressWarnings("unchecked")
    private <T> T proxy(Class<T> type,java.lang.reflect.InvocationHandler handler) {
        return (T)Proxy.newProxyInstance(type.getClassLoader(),new Class[]{type},handler);
    }
    private ExamMediaServiceImpl service() {
        var users=proxy(UserRepository.class,(p,m,a)-> {
            if(m.getName().equals("findByUsername")) { userReads++; return Optional.of(teacher); }
            throw new UnsupportedOperationException(m.getName());
        });
        var repository=proxy(ExamMediaRepository.class,(p,m,a)-> {
            if(m.getName().equals("save")) {calls.add("reserve");media=(ExamMedia)a[0];return media;}
            if(m.getName().equals("findLockedById")) {calls.add("lock");return Optional.ofNullable(media);}
            if(m.getName().equals("findAllLockedByIds")) {
                batchReads++;
                return new ArrayList<>(batchMedia.values());
            }
            throw new UnsupportedOperationException(m.getName());
        });
        StorageService storage=new StorageService() {
            public String upload(String folder,String filename,MultipartFile file) {
                calls.add("upload");assertEquals(ExamMediaStatus.UPLOADING,media.getStatus());
                assertEquals("image/png",file.getContentType());assertTrue(filename.endsWith(".png"));
                try(var in=file.getInputStream()) {assertNotNull(ImageIO.read(in));} catch(IOException e) {throw new RuntimeException(e);}
                if(failStorage) throw new IllegalStateException("storage unavailable");return folder+"/"+filename;
            }
            public void delete(String path) {throw new UnsupportedOperationException();}
            public String getUrl(String path) {return "https://example.invalid/"+path;}
        };
        var lifecycle = new ExamMediaLifecycle(repository, users, 24);
        var entityManager = proxy(jakarta.persistence.EntityManager.class, (p, m, a) -> {
            if (m.getName().equals("persist")) {
                media = (ExamMedia) a[0];
                batchMedia.put(media.getId(), media);
                return null;
            }
            throw new UnsupportedOperationException(m.getName());
        });
        try {
            var field = ExamMediaLifecycle.class.getDeclaredField("entityManager");
            field.setAccessible(true);
            field.set(lifecycle, entityManager);
        } catch (ReflectiveOperationException error) {
            throw new AssertionError(error);
        }
        return new ExamMediaServiceImpl(storage,new ExamMediaValidator(5_000_000,8_000_000,16_000_000),lifecycle);
    }
    private byte[] png() throws Exception {
        var output=new ByteArrayOutputStream();var image=new BufferedImage(10,10,BufferedImage.TYPE_INT_RGB);
        ImageIO.write(image,"png",output);image.flush();return output.toByteArray();
    }
    @Test void generatedPngReusesReservationAndCompletesTemporaryMedia() throws Exception {
        var token=UUID.randomUUID();var result=service().uploadGeneratedImage("teacher",token,png());
        assertEquals(List.of("reserve","upload","lock"),calls);assertEquals(ExamMediaStatus.TEMP,media.getStatus());
        assertEquals(token,result.draftToken());assertEquals(ExamMediaType.IMAGE,result.type());
    }
    @Test void invalidGeneratedImageDoesNotReserveOrCallStorage() {
        assertThrows(IllegalArgumentException.class,()->service().uploadGeneratedImage("teacher",UUID.randomUUID(),new byte[]{1,2,3}));
        assertTrue(calls.isEmpty());assertNull(media);
    }
    @Test void failedGeneratedUploadUsesExistingCleanupLifecycle() throws Exception {
        failStorage=true;var bytes=png();
        assertThrows(ExamMediaException.class,()->service().uploadGeneratedImage("teacher",UUID.randomUUID(),bytes));
        assertEquals(List.of("reserve","upload","lock"),calls);assertEquals(ExamMediaStatus.DELETE_PENDING,media.getStatus());
        assertNotNull(media.getNextCleanupAt());
    }

    @Test
    void batchReservesWithoutPerImageReadsAndCompletesWithSharedExpiry() throws Exception {
        var service = service();
        var images = new LinkedHashMap<UUID, byte[]>();
        images.put(UUID.randomUUID(), png());
        images.put(UUID.randomUUID(), png());
        var token = UUID.randomUUID();
        var result = service.uploadGeneratedImages("teacher", token, images);
        assertEquals(images.keySet(), result.keySet());
        assertEquals(1, userReads);
        assertEquals(1, batchReads);
        assertEquals(2, batchMedia.size());
        assertEquals(List.of("upload", "upload"), calls);
        assertTrue(batchMedia.values().stream().allMatch(file -> file.getStatus() == ExamMediaStatus.TEMP));
        assertTrue(result.values().stream().allMatch(file -> file.expiresAt()
                .isAfter(java.time.LocalDateTime.now().plusHours(23))));
    }

    @Test
    void validatesEntireBatchBeforeReservingOrPublishingAnyImage() throws Exception {
        var images = new LinkedHashMap<UUID, byte[]>();
        images.put(UUID.randomUUID(), png());
        images.put(UUID.randomUUID(), new byte[] {1});
        assertThrows(IllegalArgumentException.class,
                () -> service().uploadGeneratedImages("teacher", UUID.randomUUID(), images));
        assertTrue(batchMedia.isEmpty());
        assertTrue(calls.isEmpty());
        assertEquals(0, userReads);
    }

    @Test
    void failedBatchQueuesEveryReservedObjectForExistingCleanup() throws Exception {
        failStorage = true;
        var images = Map.of(UUID.randomUUID(), png(), UUID.randomUUID(), png());
        assertThrows(ExamMediaException.class,
                () -> service().uploadGeneratedImages("teacher", UUID.randomUUID(), images));
        assertEquals(2, batchMedia.size());
        assertTrue(batchMedia.values().stream()
                .allMatch(file -> file.getStatus() == ExamMediaStatus.DELETE_PENDING));
        assertEquals(1, batchReads);
    }
}
