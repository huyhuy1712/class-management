package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.AttendanceRepository;
import com.classmanagement.backend.repository.exam.ExamAttemptRepository;
import com.classmanagement.backend.repository.exam.StudentExamReadRepository;
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
        var attendances = mock(AttendanceRepository.class);
        var attempts = mock(ExamAttemptRepository.class);
        var examRead = mock(StudentExamReadRepository.class);
        when(attendances.findAllByStudent_Id(23L)).thenReturn(List.of());
        when(attempts.findAllByStudent_IdOrderByUpdatedAtDesc(23L)).thenReturn(List.of());
        var service = new PublicLookupServiceImpl(users, classes, attendances, attempts, examRead, storage);
        assertEquals("https://images.example/photo.jpg", service.lookupStudentByCode(" ST-23 ").getAvatar());
        student.setAvatar(" ");
        assertNull(service.lookupStudentByCode("ST-23").getAvatar());
        verify(storage, times(1)).getUrl(anyString());
    }

    @Test
    void returnsAllAttendanceStatusesAndAccurateAbsentCount() {
        var users = mock(UserRepository.class);
        var classes = mock(ClassStudentRepository.class);
        var storage = mock(StorageService.class);
        var attendances = mock(AttendanceRepository.class);
        var attempts = mock(ExamAttemptRepository.class);
        var examRead = mock(StudentExamReadRepository.class);

        var student = User.builder().id(23L).role(UserRole.STUDENT).studentCode("ST-23")
                .fullName("Nguyễn Anh Khoa").build();
        when(users.findByStudentCodeIgnoreCase("ST-23")).thenReturn(Optional.of(student));

        var classSummary = mock(com.classmanagement.backend.repository.projection.ClassroomSummaryProjection.class);
        when(classSummary.getId()).thenReturn(101L);
        when(classSummary.getCode()).thenReturn("MATH101");
        when(classSummary.getName()).thenReturn("Toán Cao Cấp");
        when(classes.findClassSummariesByStudentId(23L)).thenReturn(List.of(classSummary));

        var classroom = com.classmanagement.backend.entity.Classroom.builder().id(101L).name("Toán Cao Cấp").build();
        var att1 = com.classmanagement.backend.entity.Attendance.builder()
                .id(1L).classroom(classroom).student(student)
                .date(java.time.LocalDate.of(2026, 9, 1))
                .status(com.classmanagement.backend.entity.enums.AttendanceStatus.PRESENT)
                .build();
        var att2 = com.classmanagement.backend.entity.Attendance.builder()
                .id(2L).classroom(classroom).student(student)
                .date(java.time.LocalDate.of(2026, 9, 8))
                .status(com.classmanagement.backend.entity.enums.AttendanceStatus.LATE)
                .note("Đến muộn 10 phút")
                .build();
        var att3 = com.classmanagement.backend.entity.Attendance.builder()
                .id(3L).classroom(classroom).student(student)
                .date(java.time.LocalDate.of(2026, 9, 15))
                .status(com.classmanagement.backend.entity.enums.AttendanceStatus.ABSENT)
                .note("Nghỉ có lý do")
                .build();

        when(attendances.findAllByStudent_Id(23L)).thenReturn(List.of(att3, att1, att2));
        when(attempts.findAllByStudent_IdOrderByUpdatedAtDesc(23L)).thenReturn(List.of());

        var service = new PublicLookupServiceImpl(users, classes, attendances, attempts, examRead, storage);
        var res = service.lookupStudentByCode("ST-23");

        assertNotNull(res);
        assertEquals(1, res.getClassrooms().size());
        var cls = res.getClassrooms().get(0);
        assertEquals(1, cls.getAbsentCount()); // Only ABSENT is counted
        assertEquals(3, cls.getTotalSessions());
        assertEquals(3, cls.getAbsenceDetails().size()); // All 3 records present

        // Sorted by date ascending: att1 (01/09), att2 (08/09), att3 (15/09)
        assertEquals("01/09/2026", cls.getAbsenceDetails().get(0).getDate());
        assertEquals("PRESENT", cls.getAbsenceDetails().get(0).getStatus());
        assertEquals("Buổi 1", cls.getAbsenceDetails().get(0).getSessionName());

        assertEquals("08/09/2026", cls.getAbsenceDetails().get(1).getDate());
        assertEquals("LATE", cls.getAbsenceDetails().get(1).getStatus());
        assertEquals("Buổi 2", cls.getAbsenceDetails().get(1).getSessionName());

        assertEquals("15/09/2026", cls.getAbsenceDetails().get(2).getDate());
        assertEquals("ABSENT", cls.getAbsenceDetails().get(2).getStatus());
        assertEquals("Buổi 3", cls.getAbsenceDetails().get(2).getSessionName());
    }
}
