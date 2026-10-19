package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.entity.Material;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.MaterialType;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.repository.MaterialRepository;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.classroom.ClassroomRepository;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class MaterialServiceImplTest {
    private UserRole role = UserRole.STUDENT;
    private String username = "student";
    private boolean member = true;
    private int materialQueries;
    private final Classroom classroom = Classroom.builder().id(3L).name("Math")
            .teacher(User.builder().username("teacher").build()).build();
    private final Material material = Material.builder().id(1L).classroom(classroom)
            .type(MaterialType.DOCUMENT).title("Tài liệu ôn tập").fileUrl("https://example.com/file.pdf").build();

    @Test
    void classMemberCanReadDocuments() {
        var documents = service().getClassDocuments(3L, username);

        assertEquals(1, documents.size());
        assertEquals("Tài liệu ôn tập", documents.getFirst().getTitle());
        assertEquals(1, materialQueries);
    }

    @Test
    void removedStudentCannotReadDocuments() {
        member = false;

        assertThrows(IllegalStateException.class, () -> service().getClassDocuments(3L, username));
        assertEquals(0, materialQueries);
    }

    @Test
    void classTeacherCanReadDocuments() {
        role = UserRole.TEACHER;
        username = "teacher";

        assertEquals(1, service().getClassDocuments(3L, username).size());
    }

    @Test
    void anotherTeacherCannotReadDocuments() {
        role = UserRole.TEACHER;
        username = "other";

        assertThrows(IllegalStateException.class, () -> service().getClassDocuments(3L, username));
        assertEquals(0, materialQueries);
    }

    private MaterialServiceImpl service() {
        return new MaterialServiceImpl(
                repository(MaterialRepository.class),
                repository(ClassroomRepository.class),
                repository(ClassStudentRepository.class),
                repository(UserRepository.class));
    }

    private <T> T repository(Class<T> type) {
        return type.cast(Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, (proxy, method, args) ->
                switch (method.getName()) {
                    case "findById" -> Optional.of(classroom);
                    case "findByUsername" -> Optional.of(User.builder().role(role).username(username).build());
                    case "existsByClassroom_IdAndStudent_Username" -> {
                        assertArrayEquals(new Object[]{3L, username}, args);
                        yield member;
                    }
                    case "findAllByClassroom_IdAndTypeOrderByCreatedAtDesc" -> {
                        assertArrayEquals(new Object[]{3L, MaterialType.DOCUMENT}, args);
                        materialQueries++;
                        yield List.of(material);
                    }
                    default -> throw new AssertionError(method.getName());
                }));
    }
}
