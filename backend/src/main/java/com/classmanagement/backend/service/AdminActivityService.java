package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.activity.AdminAuditLogItem;
import com.classmanagement.backend.dto.activity.AdminAuditLogResponse;
import com.classmanagement.backend.entity.AdminActivityLog;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.repository.AdminActivityLogRepository;
import com.classmanagement.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminActivityService {

    private final AdminActivityLogRepository activityRepository;
    private final UserRepository userRepository;

    @Transactional
    public void recordByUsername(
            String adminUsername,
            String action,
            String resourceType,
            Long resourceId,
            String summary) {
        User admin = userRepository.findByUsername(adminUsername)
                .filter(user -> user.getRole() == UserRole.ADMIN)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy tài khoản quản trị viên để ghi lịch sử."));
        recordByAdminId(admin.getId(), action, resourceType, resourceId, summary);
    }

    @Transactional
    public void recordByAdminId(
            Long adminId,
            String action,
            String resourceType,
            Long resourceId,
            String summary) {
        if (adminId == null || action == null || resourceType == null
                || summary == null || summary.isBlank()) {
            throw new IllegalArgumentException("Thông tin nhật ký quản trị viên không hợp lệ.");
        }

        activityRepository.save(AdminActivityLog.builder()
                .actorId(adminId)
                .action(action)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .summary(summary.substring(0, Math.min(summary.length(), 500)))
                .build());
    }

    @Transactional(readOnly = true)
    public AdminAuditLogResponse getAdminAudit(
            int page,
            int size,
            String query,
            LocalDate from,
            LocalDate to,
            String sortOrder) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.clamp(size, 1, 100);
        String safeQuery = query == null || query.isBlank() ? null : query.trim().toLowerCase(Locale.ROOT);
        LocalDateTime fromTime = from == null ? null : from.atStartOfDay();
        LocalDateTime toTime = to == null ? null : to.plusDays(1).atStartOfDay();
        Sort.Direction direction = normalizeSort(sortOrder);

        if (from != null && to != null && from.isAfter(to)) {
            throw new IllegalArgumentException("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.");
        }

        Page<AdminActivityLog> activityPage = activityRepository.findAll(
                buildSpecification(safeQuery, fromTime, toTime),
                PageRequest.of(safePage, safeSize,
                        Sort.by(new Sort.Order(direction, "occurredAt"),
                                new Sort.Order(direction, "id"))));

        Set<Long> actorIds = activityPage.getContent().stream()
                .map(AdminActivityLog::getActorId)
                .filter(id -> id != null)
                .collect(Collectors.toCollection(HashSet::new));
        Map<Long, User> actors = userRepository.findAllById(actorIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return new AdminAuditLogResponse(
                activityPage.getContent().stream()
                        .map(log -> toItem(log, actors.get(log.getActorId())))
                        .toList(),
                activityPage.getNumber(),
                activityPage.getSize(),
                activityPage.getTotalElements(),
                activityPage.getTotalPages());
    }

    private Specification<AdminActivityLog> buildSpecification(
            String query,
            LocalDateTime fromTime,
            LocalDateTime toTime) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            var predicate = criteriaBuilder.conjunction();
            if (query != null) {
                String pattern = "%" + query + "%";
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("summary")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("action")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("resourceType")), pattern)));
            }
            if (fromTime != null) {
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.greaterThanOrEqualTo(root.get("occurredAt"), fromTime));
            }
            if (toTime != null) {
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.lessThan(root.get("occurredAt"), toTime));
            }
            return predicate;
        };
    }

    private Sort.Direction normalizeSort(String sortOrder) {
        if (sortOrder == null || sortOrder.isBlank() || "newest".equalsIgnoreCase(sortOrder)) {
            return Sort.Direction.DESC;
        }
        if ("oldest".equalsIgnoreCase(sortOrder)) {
            return Sort.Direction.ASC;
        }
        throw new IllegalArgumentException("Thứ tự sắp xếp không hợp lệ.");
    }

    private AdminAuditLogItem toItem(AdminActivityLog log, User actor) {
        return new AdminAuditLogItem(
                log.getId(),
                log.getActorId(),
                actor == null ? null : actor.getFullName(),
                actor == null ? null : actor.getUsername(),
                actor == null ? null : actor.getRole(),
                log.getAction(),
                log.getResourceType(),
                log.getResourceId(),
                log.getSummary(),
                log.getOccurredAt());
    }
}
