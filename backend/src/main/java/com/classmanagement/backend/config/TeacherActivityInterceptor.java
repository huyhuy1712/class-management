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

        ActivityDescriptor descriptor;
        if (actor.getRole() == UserRole.STUDENT) {
            descriptor = describeStudent(request.getMethod(), path);
            if (descriptor == null && path.contains("/feed/")) {
                descriptor = describe(request.getMethod(), path);
            }
        } else {
            descriptor = actor.getRole() == UserRole.TEACHER
                    ? describe(request.getMethod(), path)
                    : null;
        }
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
                if (segments.size() == 2 && "POST".equalsIgnoreCase(method)) {
                    return null;
                }
                if (segments.size() == 3 && "DELETE".equalsIgnoreCase(method)) {
                    return null;
                }
                classId = numericSegment(segments, 2);
                if (segments.size() > 3 && "attendances".equals(segments.get(3))) {
                    return null;
                } else if (segments.size() > 3 && "lessons".equals(segments.get(3))) {
                    return null;
                } else if (segments.size() > 3 && "feed".equals(segments.get(3))) {
                    if ("POST".equalsIgnoreCase(method)
                            && ("posts".equals(lastSegment(segments))
                                    || "comments".equals(lastSegment(segments)))) {
                        return null;
                    }
                    resourceType = "CLASS_FEED";
                    int commentsIndex = segments.indexOf("comments");
                    resourceId = commentsIndex >= 0
                            ? numericSegment(segments, commentsIndex - 1)
                            : numericSegment(segments, 5);
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
                if (segments.size() == 3 && "DELETE".equalsIgnoreCase(method)) {
                    return null;
                }
                boolean createOrCopy = "POST".equalsIgnoreCase(method)
                        && (segments.size() == 2
                                || (segments.size() == 4 && "copy".equals(segments.get(3))));
                boolean updateExam = "PUT".equalsIgnoreCase(method)
                        && (segments.size() == 3
                                || (segments.size() == 4 && "content".equals(segments.get(3))));
                boolean changePublication = "PATCH".equalsIgnoreCase(method)
                        && segments.size() == 4
                        && ("publish".equals(segments.get(3)) || "unpublish".equals(segments.get(3)));
                boolean updateResultSettings = "PATCH".equalsIgnoreCase(method)
                        && segments.size() == 6
                        && "result-settings".equals(segments.get(5));
                if (createOrCopy || updateExam || changePublication || updateResultSettings) {
                    return null;
                }
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
                if ((segments.size() == 2 && "POST".equalsIgnoreCase(method))
                        || (segments.size() == 3 && "PUT".equalsIgnoreCase(method))
                        || (segments.size() == 3 && "DELETE".equalsIgnoreCase(method))) {
                    return null;
                }
                resourceType = "HOMEWORK";
                resourceId = numericSegment(segments, 2);
                operation = lastSegment(segments);
            }
            case "materials" -> {
                if (("POST".equalsIgnoreCase(method) && segments.size() <= 3)
                        || ("DELETE".equalsIgnoreCase(method) && segments.size() == 3)
                        || ("DELETE".equalsIgnoreCase(method) && segments.size() == 5)) {
                    return null;
                }
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
        } else if (segments.contains("imports") && "DELETE".equalsIgnoreCase(method)) {
            action = "CANCEL";
        } else if ((segments.contains("imports") || segments.contains("import"))
                && "POST".equalsIgnoreCase(method)) {
            action = "IMPORT";
        } else if (segments.contains("publish") || "publish".equals(operation)) {
            action = "PUBLISH";
        } else if (segments.contains("unpublish") || "unpublish".equals(operation)) {
            action = "UNPUBLISH";
        } else if (segments.contains("reopen") || "reopen".equals(operation)) {
            action = "REOPEN";
        } else if (segments.contains("reset")) {
            action = "RESET";
        } else if (segments.contains("deadline")) {
            action = "UPDATE_DEADLINE";
        } else if (segments.contains("archive")) {
            action = "ARCHIVE";
        } else if (segments.contains("activate")) {
            action = "ACTIVATE";
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
        } else if ("ATTENDANCE".equals(resourceType) && "POST".equalsIgnoreCase(method)) {
            action = "MARK_ATTENDANCE";
        } else if (segments.contains("assignments") && "POST".equalsIgnoreCase(method)) {
            action = "ASSIGN";
        } else if (segments.contains("comments") && "POST".equalsIgnoreCase(method)) {
            action = "COMMENT";
        } else if ("classes".equals(operation) && "DELETE".equalsIgnoreCase(method)) {
            action = "REMOVE";
        }

        String summary = createSummary(resourceType, action);
        if ("CLASS_FEED".equals(resourceType) && segments.contains("comments")) {
            summary = switch (action) {
                case "DELETE" -> "Xóa bình luận";
                case "INTERACT" -> "Tương tác với bình luận";
                default -> "Cập nhật bình luận";
            };
        }
        if ("HOMEWORK".equals(resourceType)
                && segments.size() > 5
                && "submissions".equals(segments.get(3))) {
            Long studentId = numericSegment(segments, 4);
            if (studentId != null) {
                String studentName = userRepository.findById(studentId)
                        .map(User::getFullName)
                        .orElse(null);
                if (studentName != null && !studentName.isBlank()) {
                    summary = summary + " — học sinh " + studentName;
                }
            }
        }

        if ("DELETE".equals(action) && "CLASSROOM".equals(resourceType)) {
            classId = null;
        }

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
        if ("ADD".equals(action) && "STUDENT".equals(resourceType)) {
            return "Thêm học sinh vào lớp học";
        }
        if ("REMOVE".equals(action) && "STUDENT".equals(resourceType)) {
            return "Gỡ học sinh khỏi lớp học";
        }
        if ("UPDATE_DEADLINE".equals(action)) {
            return "Cập nhật hạn nộp bài tập";
        }
        String actionLabel = switch (action) {
            case "CREATE" -> "Tạo";
            case "DELETE" -> "Xóa";
            case "GRADE" -> "Chấm điểm";
            case "PUBLISH" -> "Xuất bản";
            case "UNPUBLISH" -> "Thu hồi xuất bản";
            case "REOPEN" -> "Mở lại";
            case "RESET" -> "Đặt lại lượt làm";
            case "ARCHIVE" -> "Lưu trữ";
            case "ACTIVATE" -> "Kích hoạt";
            case "APPROVE" -> "Duyệt yêu cầu";
            case "REJECT" -> "Từ chối yêu cầu";
            case "ADD" -> "STUDENT".equals(resourceType) ? "Thêm học sinh vào" : "Thêm";
            case "REMOVE" -> "STUDENT".equals(resourceType) ? "Gỡ học sinh khỏi" : "Gỡ";
            case "MARK_ATTENDANCE" -> "Điểm danh";
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
        if ("REMOVE".equals(action) && "MATERIAL".equals(resourceType)) {
            return "Gỡ tài liệu khỏi lớp học";
        }
        if ("MARK_ATTENDANCE".equals(action)) {
            return "Điểm danh";
        }
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
