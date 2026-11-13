package com.classmanagement.backend.config;

import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.service.TeacherActivityService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class TeacherActivityInterceptor implements HandlerInterceptor {

    private static final Pattern NUMERIC_ID = Pattern.compile("\\d+");
    private static final List<String> TRACKED_PREFIXES = List.of(
            "/api/classes",
            "/api/exams",
            "/api/exam-assignments",
            "/api/exam-attempts",
            "/api/homework-assignments",
            "/api/requests",
            "/api/materials");

    private final UserRepository userRepository;
    private final TeacherActivityService activityService;

    @Override
    public void afterCompletion(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler,
            Exception exception) {
        if (exception != null || response.getStatus() < 200 || response.getStatus() >= 300
                || !isMutation(request.getMethod())) {
            return;
        }

        String path = request.getRequestURI();
        if (TRACKED_PREFIXES.stream().noneMatch(path::startsWith)) {
            return;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return;
        }

        User actor = userRepository.findByUsername(authentication.getName()).orElse(null);
        if (actor == null) {
            return;
        }

        ActivityDescriptor descriptor = actor.getRole() == UserRole.STUDENT
                ? describeStudent(request.getMethod(), path)
                : actor.getRole() == UserRole.TEACHER ? describe(request.getMethod(), path) : null;
        if (descriptor != null) {
            activityService.record(actor.getId(), descriptor.action(), descriptor.resourceType(),
                    descriptor.resourceId(), descriptor.classId(), descriptor.summary());
        }
    }

    private ActivityDescriptor describeStudent(String method, String path) {
        List<String> segments = Arrays.stream(path.split("/"))
                .filter(segment -> !segment.isBlank())
                .toList();
        if (segments.size() < 3) {
            return null;
        }

        if ("POST".equalsIgnoreCase(method)
                && segments.size() == 4
                && "classes".equals(segments.get(1))
                && NUMERIC_ID.matcher(segments.get(2)).matches()
                && "attendances".equals(segments.get(3))) {
            Long classId = numericSegment(segments, 2);
            return new ActivityDescriptor("ATTEND", "ATTENDANCE", null, classId,
                    "Điểm danh lớp học");
        }

        if ("POST".equalsIgnoreCase(method)
                && segments.size() == 5
                && "classes".equals(segments.get(1))
                && NUMERIC_ID.matcher(segments.get(2)).matches()
                && "feed".equals(segments.get(3))
                && "posts".equals(segments.get(4))) {
            Long classId = numericSegment(segments, 2);
            return new ActivityDescriptor("CREATE", "CLASS_FEED", null, classId,
                    "Đăng bài lên bảng tin lớp");
        }

        if ("POST".equalsIgnoreCase(method)
                && segments.size() == 7
                && "classes".equals(segments.get(1))
                && NUMERIC_ID.matcher(segments.get(2)).matches()
                && "feed".equals(segments.get(3))
                && "posts".equals(segments.get(4))
                && NUMERIC_ID.matcher(segments.get(5)).matches()
                && "comments".equals(segments.get(6))) {
            Long classId = numericSegment(segments, 2);
            Long postId = numericSegment(segments, 5);
            return new ActivityDescriptor("COMMENT", "CLASS_FEED", postId, classId,
                    "Bình luận bài viết lớp học");
        }

        if ("POST".equalsIgnoreCase(method)
                && segments.size() == 4
                && "exam-assignments".equals(segments.get(1))
                && NUMERIC_ID.matcher(segments.get(2)).matches()
                && "attempts".equals(segments.get(3))) {
            return new ActivityDescriptor("START", "EXAM", numericSegment(segments, 2), null,
                    "Bắt đầu làm bài kiểm tra");
        }

        if ("POST".equalsIgnoreCase(method)
                && segments.size() == 4
                && "exam-attempts".equals(segments.get(1))
                && NUMERIC_ID.matcher(segments.get(2)).matches()
                && "submit".equals(segments.get(3))) {
            return new ActivityDescriptor("SUBMIT", "EXAM", numericSegment(segments, 2), null,
                    "Nộp bài kiểm tra");
        }

        if ("PUT".equalsIgnoreCase(method)
                && segments.size() == 4
                && "homework-assignments".equals(segments.get(1))
                && NUMERIC_ID.matcher(segments.get(2)).matches()
                && "submission".equals(segments.get(3))) {
            return new ActivityDescriptor("SUBMIT", "HOMEWORK", numericSegment(segments, 2), null,
                    "Nộp bài tập");
        }

        if ("POST".equalsIgnoreCase(method)
                && segments.size() == 4
                && "requests".equals(segments.get(1))
                && "join-class".equals(segments.get(2))
                && NUMERIC_ID.matcher(segments.get(3)).matches()) {
            Long classId = numericSegment(segments, 3);
            return new ActivityDescriptor("REQUEST_JOIN", "CLASSROOM", classId, classId,
                    "Gửi yêu cầu tham gia lớp học");
        }

        return null;
    }

    private boolean isMutation(String method) {
        return "POST".equalsIgnoreCase(method)
                || "PUT".equalsIgnoreCase(method)
                || "PATCH".equalsIgnoreCase(method)
                || "DELETE".equalsIgnoreCase(method);
    }

    private ActivityDescriptor describe(String method, String path) {
        List<String> segments = Arrays.stream(path.split("/"))
                .filter(segment -> !segment.isBlank())
                .toList();
        if (segments.size() < 2) {
            return null;
        }

        String root = segments.get(1);
        String action = defaultAction(method);
        String resourceType;
        Long resourceId = null;
        Long classId = null;
        String operation = segments.size() > 3 ? segments.get(3).toLowerCase(Locale.ROOT) : "";

        switch (root) {
            case "classes" -> {
                classId = numericSegment(segments, 2);
                if (segments.size() > 3 && "attendances".equals(segments.get(3))) {
                    resourceType = "ATTENDANCE";
                    resourceId = numericSegment(segments, 4);
                    operation = lastSegment(segments);
                } else if (segments.size() > 3 && "lessons".equals(segments.get(3))) {
                    resourceType = "LESSON";
                    resourceId = numericSegment(segments, 4);
                } else if (segments.size() > 3 && "feed".equals(segments.get(3))) {
                    resourceType = "CLASS_FEED";
                    resourceId = numericSegment(segments, 5);
                    operation = lastSegment(segments);
                } else if (segments.size() > 3 && "students".equals(segments.get(3))) {
                    resourceType = "STUDENT";
                    resourceId = numericSegment(segments, 4);
                    operation = "students";
                } else {
                    resourceType = "CLASSROOM";
                    resourceId = classId;
                    operation = segments.size() > 3 ? segments.get(3).toLowerCase(Locale.ROOT) : "";
                }
            }
            case "exams" -> {
                resourceType = "EXAM";
                resourceId = numericSegment(segments, 2);
                operation = lastSegment(segments);
            }
            case "exam-attempts" -> {
                resourceType = "EXAM";
                resourceId = numericSegment(segments, 2);
                operation = lastSegment(segments);
            }
            case "homework-assignments" -> {
                resourceType = "HOMEWORK";
                resourceId = numericSegment(segments, 2);
                operation = lastSegment(segments);
            }
            case "materials" -> {
                resourceType = "MATERIAL";
                resourceId = numericSegment(segments, 2);
                operation = segments.size() > 3 ? segments.get(3).toLowerCase(Locale.ROOT) : "";
                if ("classes".equals(operation)) {
                    classId = numericSegment(segments, 4);
                }
            }
            default -> {
                return null;
            }
        }

        if (segments.contains("grade") || "grades".equals(operation)) {
            action = "GRADE";
        } else if (segments.contains("publish") || "publish".equals(operation)) {
            action = "PUBLISH";
        } else if (segments.contains("unpublish") || "unpublish".equals(operation)) {
            action = "UNPUBLISH";
        } else if (segments.contains("reopen") || "reopen".equals(operation)) {
            action = "REOPEN";
        } else if (segments.contains("copy") || "copy".equals(operation)) {
            action = "CREATE";
        } else if ("vote".equals(operation) || "reactions".equals(operation)
                || "emoji".equals(operation)) {
            action = "INTERACT";
        } else if ("students".equals(operation) && "POST".equalsIgnoreCase(method)) {
            action = "ADD";
        } else if ("students".equals(operation) && "DELETE".equalsIgnoreCase(method)) {
            action = "REMOVE";
        } else if (segments.contains("absent-all")) {
            action = "MARK_ATTENDANCE";
        } else if (segments.contains("imports") && "POST".equalsIgnoreCase(method)) {
            action = "IMPORT";
        } else if (segments.contains("imports") && "DELETE".equalsIgnoreCase(method)) {
            action = "CANCEL";
        } else if (segments.contains("assignments") && "POST".equalsIgnoreCase(method)) {
            action = "ASSIGN";
        } else if (segments.contains("comments") && "POST".equalsIgnoreCase(method)) {
            action = "COMMENT";
        } else if ("classes".equals(operation) && "DELETE".equalsIgnoreCase(method)) {
            action = "REMOVE";
        }

        if ("DELETE".equals(action) && "CLASSROOM".equals(resourceType)) {
            classId = null;
        }

        String summary = createSummary(resourceType, action);
        return new ActivityDescriptor(action, resourceType, resourceId, classId, summary);
    }

    private String lastSegment(List<String> segments) {
        return segments.isEmpty() ? "" : segments.get(segments.size() - 1).toLowerCase(Locale.ROOT);
    }

    private Long numericSegment(List<String> segments, int index) {
        if (index >= segments.size() || !NUMERIC_ID.matcher(segments.get(index)).matches()) {
            return null;
        }
        try {
            return Long.valueOf(segments.get(index));
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private String defaultAction(String method) {
        return switch (method.toUpperCase(Locale.ROOT)) {
            case "POST" -> "CREATE";
            case "DELETE" -> "DELETE";
            default -> "UPDATE";
        };
    }

    private String createSummary(String resourceType, String action) {
        String actionLabel = switch (action) {
            case "CREATE" -> "Tạo";
            case "DELETE" -> "Xóa";
            case "GRADE" -> "Chấm điểm";
            case "PUBLISH" -> "Công khai";
            case "UNPUBLISH" -> "Thu hồi công khai";
            case "REOPEN" -> "Mở lại";
            case "ADD" -> "Thêm học sinh";
            case "REMOVE" -> "STUDENT".equals(resourceType) ? "Xóa học sinh" : "Gỡ tài liệu khỏi";
            case "MARK_ATTENDANCE" -> "Cập nhật";
            case "INTERACT" -> "Tương tác với";
            case "IMPORT" -> "Nhập";
            case "CANCEL" -> "Hủy nhập";
            case "ASSIGN" -> "Giao";
            case "COMMENT" -> "Bình luận";
            default -> "Cập nhật";
        };
        String resourceLabel = switch (resourceType) {
            case "CLASSROOM" -> "lớp học";
            case "EXAM" -> "đề thi";
            case "HOMEWORK" -> "bài tập";
            case "MATERIAL" -> "tài liệu";
            case "ATTENDANCE" -> "điểm danh";
            case "LESSON" -> "buổi học";
            case "CLASS_FEED" -> "bảng tin lớp";
            case "STUDENT" -> "học sinh";
            default -> "hoạt động";
        };
        return actionLabel + " " + resourceLabel;
    }

    private record ActivityDescriptor(
            String action,
            String resourceType,
            Long resourceId,
            Long classId,
            String summary) {
    }
}
