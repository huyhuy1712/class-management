package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.entity.Material;
import com.classmanagement.backend.entity.MaterialAssignment;
import com.classmanagement.backend.entity.MaterialAssignmentClass;
import com.classmanagement.backend.entity.MaterialAssignmentStudent;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.compositeID.MaterialAssignmentClassId;
import com.classmanagement.backend.entity.compositeID.MaterialAssignmentStudentId;
import com.classmanagement.backend.entity.enums.MaterialAssignmentType;
import com.classmanagement.backend.entity.enums.MaterialType;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.repository.MaterialRepository;
import com.classmanagement.backend.repository.MaterialAssignmentRepository;
import com.classmanagement.backend.repository.MaterialAssignmentClassRepository;
import com.classmanagement.backend.repository.MaterialAssignmentExcludedClassRepository;
import com.classmanagement.backend.repository.MaterialAssignmentStudentRepository;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.classroom.ClassroomRepository;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import com.classmanagement.backend.service.StorageService;
import com.classmanagement.backend.service.impl.material.MaterialAssignmentManager;
import com.classmanagement.backend.service.impl.material.MaterialDistribution;
import com.classmanagement.backend.service.impl.material.MaterialDocumentMapper;
import com.classmanagement.backend.service.impl.material.MaterialFileSupport;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MaterialServiceImplTest {
    private UserRole role = UserRole.STUDENT;
    private String username = "student";
    private boolean member = true;
    private int materialQueries;
    private final Classroom classroom = Classroom.builder().id(3L).name("Math")
            .teacher(User.builder().id(8L).username("teacher").build()).build();
    private final Material material = Material.builder().id(1L).teacher(classroom.getTeacher())
            .type(MaterialType.DOCUMENT).title("Tài liệu ôn tập").fileUrl("https://example.com/file.pdf").build();
    private final MaterialAssignment assignment = MaterialAssignment.builder().id(12L).material(material)
            .assignmentType(MaterialAssignmentType.CLASS).build();
    private final MaterialAssignmentClass classTarget = MaterialAssignmentClass.builder()
            .id(new MaterialAssignmentClassId(12L, 3L)).assignment(assignment).classroom(classroom).build();

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

    @Test
    void removingLastClassTargetDeletesAssignmentButKeepsMaterialAndFile() {
        User teacher = User.builder().id(8L).username("teacher").role(UserRole.TEACHER).build();
        Classroom teacherClass = Classroom.builder().id(3L).teacher(teacher).build();
        Material teacherMaterial = Material.builder().id(1L).teacher(teacher)
                .type(MaterialType.DOCUMENT).fileUrl("materials/teachers/8/file/document.pdf").build();
        MaterialAssignment assignment = MaterialAssignment.builder().id(12L).material(teacherMaterial)
                .assignmentType(MaterialAssignmentType.CLASS).build();
        MaterialAssignmentClass target = MaterialAssignmentClass.builder()
                .id(new MaterialAssignmentClassId(12L, 3L)).assignment(assignment).classroom(teacherClass).build();
        UserRepository users = mock(UserRepository.class);
        ClassroomRepository classrooms = mock(ClassroomRepository.class);
        MaterialRepository materials = mock(MaterialRepository.class);
        MaterialAssignmentRepository assignments = mock(MaterialAssignmentRepository.class);
        MaterialAssignmentClassRepository classTargets = mock(MaterialAssignmentClassRepository.class);
        MaterialAssignmentStudentRepository studentTargets = mock(MaterialAssignmentStudentRepository.class);
        MaterialAssignmentExcludedClassRepository excludedTargets = mock(MaterialAssignmentExcludedClassRepository.class);
        StorageService storage = mock(StorageService.class);
        when(users.findByUsername("teacher")).thenReturn(Optional.of(teacher));
        when(classrooms.findById(3L)).thenReturn(Optional.of(teacherClass));
        when(materials.findByIdAndTeacher_Id(1L, 8L)).thenReturn(Optional.of(teacherMaterial));
        when(assignments.findByMaterial_Id(1L)).thenReturn(Optional.of(assignment));
        when(classTargets.findById(new MaterialAssignmentClassId(12L, 3L))).thenReturn(Optional.of(target));
        when(classTargets.findAllById_AssignmentIdIn(List.of(12L))).thenReturn(List.of());

        service(materials, assignments, classTargets, studentTargets, excludedTargets,
                classrooms, mock(ClassStudentRepository.class), users, storage)
                .removeDocumentFromClass(1L, 3L, "teacher");

        verify(classTargets).delete(target);
        verify(assignments).delete(assignment);
        verify(materials, never()).delete(teacherMaterial);
        verify(storage, never()).delete(anyString());
    }

    @Test
    void removingLastStudentTargetDeletesAssignmentButKeepsMaterialAndFile() {
        User teacher = User.builder().id(8L).username("teacher").role(UserRole.TEACHER).build();
        Classroom teacherClass = Classroom.builder().id(3L).teacher(teacher).build();
        Material teacherMaterial = Material.builder().id(1L).teacher(teacher)
                .type(MaterialType.DOCUMENT).fileUrl("materials/teachers/8/file/document.pdf").build();
        MaterialAssignment assignment = MaterialAssignment.builder().id(12L).material(teacherMaterial)
                .assignmentType(MaterialAssignmentType.STUDENT).build();
        MaterialAssignmentStudent target = MaterialAssignmentStudent.builder()
                .id(new MaterialAssignmentStudentId(12L, 19L)).assignment(assignment).classroom(teacherClass).build();
        UserRepository users = mock(UserRepository.class);
        ClassroomRepository classrooms = mock(ClassroomRepository.class);
        MaterialRepository materials = mock(MaterialRepository.class);
        MaterialAssignmentRepository assignments = mock(MaterialAssignmentRepository.class);
        MaterialAssignmentClassRepository classTargets = mock(MaterialAssignmentClassRepository.class);
        MaterialAssignmentStudentRepository studentTargets = mock(MaterialAssignmentStudentRepository.class);
        MaterialAssignmentExcludedClassRepository excludedTargets = mock(MaterialAssignmentExcludedClassRepository.class);
        StorageService storage = mock(StorageService.class);
        when(users.findByUsername("teacher")).thenReturn(Optional.of(teacher));
        when(classrooms.findById(3L)).thenReturn(Optional.of(teacherClass));
        when(materials.findByIdAndTeacher_Id(1L, 8L)).thenReturn(Optional.of(teacherMaterial));
        when(assignments.findByMaterial_Id(1L)).thenReturn(Optional.of(assignment));
        when(studentTargets.findAllById_AssignmentIdAndClassroom_Id(12L, 3L)).thenReturn(List.of(target));
        when(studentTargets.findAllById_AssignmentIdIn(List.of(12L))).thenReturn(List.of());

        service(materials, assignments, classTargets, studentTargets, excludedTargets,
                classrooms, mock(ClassStudentRepository.class), users, storage)
                .removeDocumentFromClass(1L, 3L, "teacher");

        verify(studentTargets).deleteAll(List.of(target));
        verify(assignments).delete(assignment);
        verify(materials, never()).delete(teacherMaterial);
        verify(storage, never()).delete(anyString());
    }

    @Test
    void updatingDocumentReplacesAssignmentTargets() {
        MaterialAssignmentRepository assignments = mock(MaterialAssignmentRepository.class);
        MaterialAssignmentClassRepository classTargets = mock(MaterialAssignmentClassRepository.class);
        MaterialAssignmentExcludedClassRepository excludedTargets =
                mock(MaterialAssignmentExcludedClassRepository.class);
        MaterialAssignmentStudentRepository studentTargets = mock(MaterialAssignmentStudentRepository.class);
        ClassroomRepository classrooms = mock(ClassroomRepository.class);
        ClassStudentRepository classStudents = mock(ClassStudentRepository.class);
        UserRepository users = mock(UserRepository.class);
        MaterialAssignmentManager manager = new MaterialAssignmentManager(
                assignments, classTargets, excludedTargets, studentTargets, classrooms, classStudents, users);
        when(assignments.findByMaterial_Id(1L)).thenReturn(Optional.of(assignment));
        when(classTargets.findAllById_AssignmentIdIn(List.of(12L))).thenReturn(List.of());
        when(excludedTargets.findAllById_AssignmentIdIn(List.of(12L))).thenReturn(List.of());
        when(studentTargets.findAllById_AssignmentIdIn(List.of(12L))).thenReturn(List.of());

        manager.updateAssignment(material, MaterialAssignmentType.CLASS,
                new MaterialDistribution(List.of(classroom), List.of(), java.util.Map.of()));

        assertEquals(MaterialAssignmentType.CLASS, assignment.getAssignmentType());
        verify(classTargets).deleteAll(List.of());
        verify(studentTargets).deleteAll(List.of());
        verify(excludedTargets).deleteAll(List.of());
        verify(classTargets).saveAll(anyList());
    }

    private MaterialServiceImpl service() {
        MaterialRepository materials = repository(MaterialRepository.class);
        MaterialAssignmentRepository assignments = repository(MaterialAssignmentRepository.class);
        MaterialAssignmentClassRepository classTargets = repository(MaterialAssignmentClassRepository.class);
        MaterialAssignmentStudentRepository studentTargets = repository(MaterialAssignmentStudentRepository.class);
        MaterialAssignmentExcludedClassRepository excludedTargets =
                repository(MaterialAssignmentExcludedClassRepository.class);
        ClassroomRepository classrooms = repository(ClassroomRepository.class);
        ClassStudentRepository classStudents = repository(ClassStudentRepository.class);
        UserRepository users = repository(UserRepository.class);
        StorageService storage = null;
        return service(materials, assignments, classTargets, studentTargets, excludedTargets,
                classrooms, classStudents, users, storage);
    }

    private MaterialServiceImpl service(
            MaterialRepository materials,
            MaterialAssignmentRepository assignments,
            MaterialAssignmentClassRepository classTargets,
            MaterialAssignmentStudentRepository studentTargets,
            MaterialAssignmentExcludedClassRepository excludedTargets,
            ClassroomRepository classrooms,
            ClassStudentRepository classStudents,
            UserRepository users,
            StorageService storage) {
        return new MaterialServiceImpl(materials, assignments, classTargets, studentTargets, excludedTargets,
                classrooms, classStudents, users, storage,
                new MaterialAssignmentManager(assignments, classTargets, excludedTargets, studentTargets,
                        classrooms, classStudents, users),
                new MaterialDocumentMapper(assignments, classTargets, excludedTargets, studentTargets, storage),
                new MaterialFileSupport(storage));
    }

    private <T> T repository(Class<T> type) {
        return type.cast(Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, (proxy, method, args) ->
                switch (method.getName()) {
                    case "findById" -> Optional.of(classroom);
                    case "findByUsername" -> Optional.of(User.builder().id("teacher".equals(username) ? 8L : 9L)
                            .role(role).username(username).build());
                    case "existsByClassroom_IdAndStudent_Username" -> {
                        assertArrayEquals(new Object[]{3L, username}, args);
                        yield member;
                    }
                    case "findAllByTeacher_IdAndTypeOrderByCreatedAtDesc" -> {
                        materialQueries++;
                        yield List.of(material);
                    }
                    case "findAllByMaterial_IdIn" -> List.of(assignment);
                    case "findAllById_AssignmentIdIn" -> type == MaterialAssignmentClassRepository.class
                            ? List.of(classTarget)
                            : List.of();
                    case "findAllByClassroom_Id" -> List.of();
                    case "findAllByIdIn" -> List.of();
                    case "findStudentIdsByClassroomId" -> List.of();
                    default -> throw new AssertionError(method.getName());
                }));
    }
}
