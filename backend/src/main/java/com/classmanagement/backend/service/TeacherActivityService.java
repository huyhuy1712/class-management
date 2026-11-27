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
import org.springframework.jdbc.core.JdbcTemplate;
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
    private final JdbcTemplate jdbc;

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
                .summary(resolveSummary(action, resourceType, resourceId, classId, summary))
                .build());
    }

    private String resolveSummary(
            String action,
            String resourceType,
            Long resourceId,
            Long classId,
            String summary) {
        if (summary == null || summary.contains(":")) {
            return summary;
        }

        List<String> details = new ArrayList<>();
        String resourceDetail = resolveResourceDetail(action, resourceType, resourceId);
        if (resourceDetail != null && !resourceDetail.isBlank()) {
            details.add(resourceDetail);
        }

        Long resolvedClassId = classId;
        if (resolvedClassId == null && "CLASSROOM".equals(resourceType)) {
            resolvedClassId = resourceId;
        }
        if (resolvedClassId != null && !"CLASSROOM".equals(resourceType)) {
            String classroomName = findValue("SELECT name FROM classes WHERE id = ?", resolvedClassId);
            if (classroomName != null && !classroomName.isBlank()) {
                details.add("lớp " + classroomName);
            }
        }

        if (details.isEmpty()) {
            return summary;
        }

        int studentMarker = summary.lastIndexOf(" — học sinh ");
        if ("HOMEWORK".equals(resourceType) && studentMarker >= 0) {
            String base = summary.substring(0, studentMarker) + ": " + String.join(" — ", details);
            String studentDetail = summary.substring(studentMarker + " — học sinh ".length());
            String studentSuffix = " — học sinh ";
            int studentLimit = 300 - base.length() - studentSuffix.length();
            if (studentLimit <= 0) {
                return base.substring(0, Math.min(base.length(), 300));
            }
            return base + studentSuffix + studentDetail.substring(0, Math.min(studentDetail.length(), studentLimit));
        }

        int detailLimit = Math.max(0, 300 - summary.length() - 2);
        String detail = String.join(" — ", details);
        if (detail.length() > detailLimit) {
            detail = detail.substring(0, detailLimit);
        }
        return summary + ": " + detail;
    }

    private String resolveResourceDetail(String action, String resourceType, Long resourceId) {
        if (resourceId == null) {
            return null;
        }

        return switch (resourceType) {
            case "CLASSROOM" -> findValue("SELECT name FROM classes WHERE id = ?", resourceId);
            case "EXAM" -> resolveExamDetail(action, resourceId);
            case "HOMEWORK" -> prefixedValue(
                    "bài tập ",
                    findValue("SELECT title FROM homework_assignments WHERE id = ?", resourceId));
            case "MATERIAL" -> prefixedValue(
                    "tài liệu ",
                    findValue("SELECT title FROM materials WHERE id = ?", resourceId));
            case "LESSON" -> prefixedValue(
                    "buổi học ",
                    findValue("""
                            SELECT COALESCE(NULLIF(title, ''), TO_CHAR(lesson_date, 'DD/MM/YYYY'))
                            FROM lessons WHERE id = ?
                            """, resourceId));
            case "ATTENDANCE" -> resolveAttendanceDetail(action, resourceId);
            case "STUDENT" -> prefixedValue(
                    "học sinh ",
                    findValue("SELECT full_name FROM users WHERE id = ?", resourceId));
            case "CLASS_FEED" -> "bài viết #" + resourceId;
            default -> null;
        };
    }

    private String resolveExamDetail(String action, Long resourceId) {
        if ("START".equals(action)) {
            return prefixedValue("đề thi ", findValue("""
                    SELECT e.title
                    FROM exam_assignments a
                    JOIN exams e ON e.id = a.exam_id
                    WHERE a.id = ?
                    """, resourceId));
        }

        if ("SUBMIT".equals(action) || "GRADE".equals(action)
                || "REOPEN".equals(action) || "RESET".equals(action)) {
            String attemptDetail = findValue("""
                    SELECT e.title || ' — học sinh ' || u.full_name
                    FROM exam_attempts t
                    JOIN exam_assignments a ON a.id = t.assignment_id
                    JOIN exams e ON e.id = a.exam_id
                    JOIN users u ON u.id = t.student_id
                    WHERE t.id = ?
                    """, resourceId);
            if (attemptDetail != null) {
                return prefixedValue("đề thi ", attemptDetail);
            }
        }

        return prefixedValue("đề thi ", findValue("SELECT title FROM exams WHERE id = ?", resourceId));
    }

    private String resolveAttendanceDetail(String action, Long resourceId) {
        if ("DELETE".equals(action)) {
            return prefixedValue(
                    "học sinh ",
                    findValue("SELECT full_name FROM users WHERE id = ?", resourceId));
        }

        return findValue("""
                SELECT 'học sinh ' || u.full_name || ' — ngày ' || TO_CHAR(a.date, 'DD/MM/YYYY')
                FROM attendances a
                JOIN users u ON u.id = a.student_id
                WHERE a.id = ?
                """, resourceId);
    }

    private String prefixedValue(String prefix, String value) {
        return value == null || value.isBlank() ? null : prefix + value;
    }

    private String findValue(String sql, Long id) {
        return jdbc.query(sql, (resultSet, rowNumber) -> resultSet.getString(1), id)
                .stream()
                .findFirst()
                .orElse(null);
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

        User actor = userRepository.findById(actorId).orElse(null);
        return new TeacherActivityResponse(
                activityPage.getContent().stream()
                        .map(log -> toItem(log, actor == null ? null : actor.getRole()))
                        .toList(),
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
                "ATTENDANCE", "LESSON", "CLASS_FEED", "STUDENT", "VIP", "POINTS", "MISSION")
                .contains(normalized)) {
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

    private TeacherActivityItem toItem(TeacherActivityLog log, UserRole actorRole) {
        return new TeacherActivityItem(
                log.getId(),
                log.getAction(),
                log.getResourceType(),
                log.getResourceId(),
                log.getClassId(),
                log.getSummary(),
                log.getOccurredAt(),
                resolveTargetPath(log, actorRole));
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
                log.getOccurredAt(),
                resolveTargetPath(log, actor == null ? null : actor.getRole()));
    }

    private String resolveTargetPath(TeacherActivityLog log, UserRole actorRole) {
        if (actorRole == null || log.getResourceType() == null) {
            return null;
        }

        boolean teacher = actorRole == UserRole.TEACHER;
        boolean student = actorRole == UserRole.STUDENT;
        Long resourceId = log.getResourceId();
        Long classId = log.getClassId();
        String action = log.getAction();

        return switch (log.getResourceType()) {
            case "CLASSROOM" -> {
                String classListPath = teacher ? "/teacher/classes" : "/student/classes";
                Long targetClassId = resourceId == null ? classId : resourceId;
                yield targetClassId == null || "DELETE".equals(action)
                        || (student && "REQUEST_JOIN".equals(action))
                        ? classListPath
                        : classListPath + "/" + targetClassId;
            }
            case "EXAM" -> resolveExamTargetPath(action, resourceId, teacher, student);
            case "GRADE" -> teacher
                    ? classId == null ? "/teacher/classes" : "/teacher/classes/" + classId + "/grades"
                    : student ? classId == null ? "/student/grades" : "/student/classes/" + classId
                            : null;
            case "HOMEWORK" -> {
                String homeworkListPath = teacher ? "/teacher/homework" : "/student/homework";
                yield resourceId == null || (teacher && "DELETE".equals(action))
                        ? homeworkListPath
                        : homeworkListPath + "/" + resourceId;
            }
            case "MATERIAL" -> teacher
                    ? classId == null ? "/teacher/materials" : "/teacher/classes/" + classId + "/materials"
                    : student && classId != null ? "/student/classes/" + classId : null;
            case "ATTENDANCE" -> teacher
                    ? classId == null ? "/teacher/classes" : "/teacher/classes/" + classId + "/attendance"
                    : student ? classId == null ? "/student/attendance" : "/student/classes/" + classId
                            : null;
            case "LESSON" -> teacher
                    ? classId == null ? "/teacher/classes" : "/teacher/classes/" + classId
                    : student && classId != null ? "/student/classes/" + classId : null;
            case "CLASS_FEED" -> teacher
                    ? classId == null ? "/teacher/classes" : "/teacher/classes/" + classId + "/announcements"
                    : student && classId != null ? "/student/classes/" + classId : null;
            case "STUDENT" -> teacher
                    ? classId != null && resourceId != null && !"REMOVE".equals(action)
                            ? "/teacher/classes/" + classId + "/students/" + resourceId
                            : "/teacher/classes"
                    : null;
            case "VIP", "POINTS", "MISSION" -> teacher ? "/teacher/billing" : null;
            default -> null;
        };
    }

    private String resolveExamTargetPath(String action, Long resourceId, boolean teacher, boolean student) {
        if (teacher) {
            if (resourceId == null || "DELETE".equals(action)) {
                return "/teacher/exams";
            }
            if ("GRADE".equals(action) || "REOPEN".equals(action) || "RESET".equals(action)) {
                String attemptPath = findValue("""
                        SELECT '/teacher/exams/' || e.id || '/assignments/' || a.id || '/attempts/' || t.id
                        FROM exam_attempts t
                        JOIN exam_assignments a ON a.id = t.assignment_id
                        JOIN exams e ON e.id = a.exam_id
                        WHERE t.id = ?
                        """, resourceId);
                return attemptPath == null ? "/teacher/exams" : attemptPath;
            }
            return "/teacher/exams/" + resourceId;
        }
        if (student) {
            if (resourceId == null) {
                return "/student/exams";
            }
            return switch (action) {
                case "START" -> "/student/exams/" + resourceId;
                case "SUBMIT" -> "/student/exam-attempts/" + resourceId + "/result";
                default -> "/student/exams";
            };
        }
        return null;
    }
}
