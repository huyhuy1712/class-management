package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import com.classmanagement.backend.service.StorageService;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PublicLookupServiceImplTest {
    @Test
    void publicAvatarUsesStorageUrlInsteadOfRawKey() {
        var users = mock(UserRepository.class);
        var classes = mock(ClassStudentRepository.class);
        var storage = mock(StorageService.class);
        var student = User.builder().id(23L).role(UserRole.STUDENT).studentCode("ST-23")
                .fullName("Nguyễn Anh Khoa").avatar("avatars/23/photo.jpg").build();
        when(users.findByStudentCodeIgnoreCase("ST-23")).thenReturn(Optional.of(student));
        when(classes.findClassSummariesByStudentId(23L)).thenReturn(List.of());
        when(storage.getUrl("avatars/23/photo.jpg")).thenReturn("https://images.example/photo.jpg");
        var service = new PublicLookupServiceImpl(users, classes, storage);
        assertEquals("https://images.example/photo.jpg", service.lookupStudentByCode(" ST-23 ").getAvatar());
        student.setAvatar(" ");
        assertNull(service.lookupStudentByCode("ST-23").getAvatar());
        verify(storage, times(1)).getUrl(anyString());
    }
}
