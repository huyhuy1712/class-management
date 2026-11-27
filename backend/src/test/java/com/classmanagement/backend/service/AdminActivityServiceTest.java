package com.classmanagement.backend.service;

import com.classmanagement.backend.entity.AdminActivityLog;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.repository.AdminActivityLogRepository;
import com.classmanagement.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminActivityServiceTest {

    @Test
    void recordsAdminActionWithActorAndResourceDetails() {
        AdminActivityLogRepository activityRepository = mock(AdminActivityLogRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        when(userRepository.findByUsername("admin"))
                .thenReturn(Optional.of(User.builder().id(5L).role(UserRole.ADMIN).build()));

        service(activityRepository, userRepository).recordByUsername(
                "admin", "CREATE", "SUBJECT", 12L, "Tạo môn học: Toán (MATH)");

        verify(activityRepository).save(argThat(log ->
                log.getActorId().equals(5L)
                        && log.getAction().equals("CREATE")
                        && log.getResourceType().equals("SUBJECT")
                        && log.getResourceId().equals(12L)
                        && log.getSummary().equals("Tạo môn học: Toán (MATH)")));
    }

    @Test
    void onlyAdminAccountsCanBeRecordedByUsername() {
        AdminActivityLogRepository activityRepository = mock(AdminActivityLogRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        when(userRepository.findByUsername("teacher"))
                .thenReturn(Optional.of(User.builder().id(8L).role(UserRole.TEACHER).build()));

        assertThrows(IllegalArgumentException.class, () -> service(activityRepository, userRepository)
                .recordByUsername("teacher", "UPDATE", "SUBJECT", 12L, "Cập nhật môn học"));
    }

    @Test
    void returnsAdminNamesAndPagedAuditLogs() {
        AdminActivityLogRepository activityRepository = mock(AdminActivityLogRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        AdminActivityLog log = AdminActivityLog.builder()
                .id(3L)
                .actorId(5L)
                .action("DELETE")
                .resourceType("MISSION")
                .resourceId(17L)
                .summary("Xóa nhiệm vụ: Hoàn thành lớp")
                .build();
        when(activityRepository.findAll(
                org.mockito.ArgumentMatchers.<Specification<AdminActivityLog>>any(),
                org.mockito.ArgumentMatchers.<Pageable>any()))
                .thenAnswer(invocation -> new PageImpl<AdminActivityLog>(
                        List.of(log), invocation.getArgument(1), 1));
        when(userRepository.findAllById(any())).thenReturn(List.of(
                User.builder().id(5L).fullName("Quản trị viên").username("admin")
                        .role(UserRole.ADMIN).build()));

        var result = service(activityRepository, userRepository)
                .getAdminAudit(0, 20, null, null, null, "newest");

        assertEquals(1L, result.totalElements());
        assertEquals("Quản trị viên", result.items().getFirst().actorName());
        assertEquals(UserRole.ADMIN, result.items().getFirst().actorRole());
        assertEquals("Xóa nhiệm vụ: Hoàn thành lớp", result.items().getFirst().summary());
        verify(activityRepository).findAll(
                org.mockito.ArgumentMatchers.<Specification<AdminActivityLog>>any(),
                matchingPageable());
    }

    private AdminActivityService service(
            AdminActivityLogRepository activityRepository,
            UserRepository userRepository) {
        return new AdminActivityService(activityRepository, userRepository);
    }

    private Pageable matchingPageable() {
        return org.mockito.ArgumentMatchers.argThat(pageable ->
                pageable.getPageSize() == 20
                        && pageable.getSort().getOrderFor("occurredAt").isDescending());
    }
}
