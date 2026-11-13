package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.activity.TeacherActivityItem;
import com.classmanagement.backend.dto.activity.TeacherActivityResponse;
import com.classmanagement.backend.dto.activity.TeacherActivitySummary;
import com.classmanagement.backend.dto.activity.AdminActivityItem;
import com.classmanagement.backend.dto.activity.AdminActivityResponse;
import com.classmanagement.backend.entity.TeacherActivityLog;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.repository.TeacherActivityLogRepository;
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
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeacherActivityService {

    private final TeacherActivityLogRepository activityRepository;
    private final UserRepository userRepository;

    @Transactional
    public void record(
            Long actorId,
            String action,
            String resourceType,
            Long resourceId,
            Long classId,
            String summary) {
        activityRepository.save(TeacherActivityLog.builder()
                .actorId(actorId)
                .action(action)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .classId(classId)
                .summary(summary)
                .build());
    }

    @Transactional(readOnly = true)
    public TeacherActivityResponse getActivity(
            Long actorId,
            int page,
            int size,
            String query,
            String category,
            LocalDate from,
            LocalDate to,
            String sortOrder) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.clamp(size, 1, 100);
        String safeQuery = query == null || query.isBlank() ? null : query.trim();
        String safeCategory = normalizeCategory(category);
        Sort.Direction direction = normalizeSort(sortOrder);
        LocalDateTime fromTime = from == null ? null : from.atStartOfDay();
        LocalDateTime toTime = to == null ? null : to.plusDays(1).atStartOfDay();

        if (from != null && to != null && from.isAfter(to)) {
            throw new IllegalArgumentException("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.");
        }

        Page<TeacherActivityLog> activityPage = activityRepository.findAll(
                buildSpecification(actorId, safeCategory, safeQuery, fromTime, toTime),
                PageRequest.of(safePage, safeSize,
                        Sort.by(new Sort.Order(direction, "occurredAt"),
                                new Sort.Order(direction, "id"))));

        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        TeacherActivitySummary summary = new TeacherActivitySummary(
                activityRepository.countByActorId(actorId),
                activityRepository.countByActorIdAndOccurredAtGreaterThanEqual(actorId, thirtyDaysAgo),
                activityRepository.countResourceTypesByActorId(actorId));

        return new TeacherActivityResponse(
                activityPage.getContent().stream().map(this::toItem).toList(),
                activityPage.getNumber(),
                activityPage.getSize(),
                activityPage.getTotalElements(),
                activityPage.getTotalPages(),
                summary);
    }

    @Transactional(readOnly = true)
    public AdminActivityResponse getAdminActivity(
            int page,
            int size,
            String query,
            String category,
            UserRole role,
            Long userId,
            LocalDate from,
            LocalDate to,
            String sortOrder) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.clamp(size, 1, 100);
        String safeQuery = query == null || query.isBlank() ? null : query.trim();
        String safeCategory = normalizeCategory(category);
        Sort.Direction direction = normalizeSort(sortOrder);
        LocalDateTime fromTime = from == null ? null : from.atStartOfDay();
        LocalDateTime toTime = to == null ? null : to.plusDays(1).atStartOfDay();

        if (from != null && to != null && from.isAfter(to)) {
            throw new IllegalArgumentException("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.");
        }

        Page<TeacherActivityLog> activityPage = activityRepository.findAll(
                buildSpecification(userId, role, safeCategory, safeQuery, fromTime, toTime),
                PageRequest.of(safePage, safeSize,
                        Sort.by(new Sort.Order(direction, "occurredAt"),
                                new Sort.Order(direction, "id"))));

        Set<Long> actorIds = activityPage.getContent().stream()
                .map(TeacherActivityLog::getActorId)
                .filter(id -> id != null)
                .collect(Collectors.toCollection(HashSet::new));
        Map<Long, User> actors = userRepository.findAllById(actorIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        TeacherActivitySummary summary = new TeacherActivitySummary(
                activityRepository.count(),
                activityRepository.countByOccurredAtGreaterThanEqual(thirtyDaysAgo),
                activityRepository.countDistinctResourceTypes());

        return new AdminActivityResponse(
                activityPage.getContent().stream()
                        .map(log -> toAdminItem(log, actors.get(log.getActorId())))
                        .toList(),
                activityPage.getNumber(),
                activityPage.getSize(),
                activityPage.getTotalElements(),
                activityPage.getTotalPages(),
                summary);
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

    private String normalizeCategory(String category) {
        if (category == null || category.isBlank() || "all".equalsIgnoreCase(category)) {
            return null;
        }

        String normalized = category.trim().toUpperCase(Locale.ROOT);
        if (!java.util.Set.of("CLASSROOM", "EXAM", "HOMEWORK", "MATERIAL", "GRADE",
                "ATTENDANCE", "LESSON", "CLASS_FEED", "STUDENT").contains(normalized)) {
            throw new IllegalArgumentException("Loại hoạt động không hợp lệ.");
        }
        return normalized;
    }

    private Specification<TeacherActivityLog> buildSpecification(
            Long actorId,
            String category,
            String query,
            LocalDateTime fromTime,
            LocalDateTime toTime) {
        return buildSpecification(actorId, null, category, query, fromTime, toTime);
    }

    private Specification<TeacherActivityLog> buildSpecification(
            Long actorId,
            UserRole role,
            String category,
            String query,
            LocalDateTime fromTime,
            LocalDateTime toTime) {
        List<Specification<TeacherActivityLog>> filters = new ArrayList<>();
        if (actorId != null) {
            filters.add((root, criteriaQuery, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("actorId"), actorId));
        }
        if (role != null) {
            filters.add((root, criteriaQuery, criteriaBuilder) -> {
                var userQuery = criteriaQuery.subquery(Long.class);
                var user = userQuery.from(User.class);
                userQuery.select(user.get("id"))
                        .where(criteriaBuilder.equal(user.get("role"), role));
                return root.get("actorId").in(userQuery);
            });
        }

        if (category != null) {
            filters.add((root, criteriaQuery, criteriaBuilder) -> {
                var resourceType = criteriaBuilder.equal(root.get("resourceType"), category);
                return "GRADE".equals(category)
                        ? criteriaBuilder.or(resourceType,
                                criteriaBuilder.equal(root.get("action"), "GRADE"))
                        : resourceType;
            });
        }

        if (query != null) {
            String pattern = "%" + query.toLowerCase(Locale.ROOT) + "%";
            filters.add((root, criteriaQuery, criteriaBuilder) -> criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("summary")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("action")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("resourceType")), pattern)));
        }

        if (fromTime != null) {
            filters.add((root, criteriaQuery, criteriaBuilder) ->
                    criteriaBuilder.greaterThanOrEqualTo(root.get("occurredAt"), fromTime));
        }
        if (toTime != null) {
            filters.add((root, criteriaQuery, criteriaBuilder) ->
                    criteriaBuilder.lessThan(root.get("occurredAt"), toTime));
        }

        return filters.isEmpty()
                ? (root, criteriaQuery, criteriaBuilder) -> criteriaBuilder.conjunction()
                : filters.stream().reduce(Specification::and).orElseThrow();
    }

    private TeacherActivityItem toItem(TeacherActivityLog log) {
        return new TeacherActivityItem(
                log.getId(),
                log.getAction(),
                log.getResourceType(),
                log.getResourceId(),
                log.getClassId(),
                log.getSummary(),
                log.getOccurredAt());
    }

    private AdminActivityItem toAdminItem(TeacherActivityLog log, User actor) {
        return new AdminActivityItem(
                log.getId(),
                log.getActorId(),
                actor == null ? null : actor.getFullName(),
                actor == null ? null : actor.getUsername(),
                actor == null ? null : actor.getRole(),
                log.getAction(),
                log.getResourceType(),
                log.getResourceId(),
                log.getClassId(),
                log.getSummary(),
                log.getOccurredAt());
    }
}
