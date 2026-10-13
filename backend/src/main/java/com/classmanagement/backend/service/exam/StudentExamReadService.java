package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.dto.exam.StudentExamResponse;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.exam.StudentExamReadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class StudentExamReadService {
    private final UserRepository users;
    private final StudentExamReadRepository repository;
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public StudentExamResponse.Page list(String username, int page, int size, String query,
            Long classId, LocalDate date, String sort) {
        if (page < 0 || size < 1 || size > 100 || (classId != null && classId <= 0)) {
            throw new IllegalArgumentException("page phải >= 0, size từ 1 đến 100, classId phải > 0");
        }
        String q = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        if (q.length() > 255 || !Set.of("newest", "oldest", "opening").contains(sort)) {
            throw new IllegalArgumentException("q tối đa 255 ký tự; sort: newest/oldest/opening");
        }
        User student = student(username);
        String pattern = "%" + q.replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
        var parameters = new MapSqlParameterSource("studentId", student.getId())
                .addValue("q", q).addValue("pattern", pattern).addValue("classId", classId)
                .addValue("dayStart", date == null ? null : date.atStartOfDay())
                .addValue("dayEnd", date == null ? null : date.plusDays(1).atStartOfDay())
                .addValue("size", size).addValue("offset", (long) page * size);
        var rows = repository.findPage(parameters, sort);
        var contexts = repository.findClasses(rows.stream().map(StudentExamReadRepository.Row::assignmentId).toList(), student.getId());
        LocalDateTime now = LocalDateTime.now(ZONE);
        var items = rows.stream().map(row -> response(row, contexts.getOrDefault(row.assignmentId(), List.of()), now)).toList();
        return new StudentExamResponse.Page(items, page, size,
                repository.countFiltered(parameters), repository.stats(student.getId()));
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public StudentExamResponse detail(String username, long assignmentId) {
        if (assignmentId <= 0) throw new IllegalArgumentException("assignmentId phải lớn hơn 0");
        User student = student(username);
        var row = repository.findAccessible(assignmentId, student.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy assignment được giao cho bạn"));
        var classes = repository.findClasses(List.of(assignmentId), student.getId());
        return response(row, classes.getOrDefault(assignmentId, List.of()), LocalDateTime.now(ZONE));
    }

    private User student(String username) {
        User user = users.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        if (user.getRole() != UserRole.STUDENT || user.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalStateException("Chỉ học sinh đang hoạt động được xem đề được giao");
        }
        return user;
    }

    static StudentExamResponse response(StudentExamReadRepository.Row row,
            List<StudentExamResponse.ClassInfo> classes, LocalDateTime now) {
        String blocked = null;
        if (!"PUBLISHED".equals(row.examStatus())
                || !Set.of("OPEN", "SCHEDULED").contains(row.assignmentStatus())) blocked = "CLOSED";
        else if (row.timeLimit() == null || row.timeLimit() <= 0 || row.maxAttempts() == null
                || row.maxAttempts() < 0) blocked = "INVALID_CONFIGURATION";
        else if (row.openTime() != null && now.isBefore(row.openTime())) blocked = "NOT_OPEN_YET";
        else if (row.closeTime() != null && !now.isBefore(row.closeTime())) blocked = "CLOSED";
        else if ("SCHEDULED".equals(row.assignmentStatus()) && row.openTime() == null) blocked = "NOT_OPEN_YET";
        boolean inProgress = "IN_PROGRESS".equals(row.attemptStatus());
        if (blocked == null && inProgress && (row.startedAt() == null || row.timeLimit() == null
                || !now.isBefore(row.startedAt().plusMinutes(row.timeLimit())))) blocked = "TIME_EXPIRED";
        if (blocked == null && !inProgress && row.maxAttempts() != null
                && row.maxAttempts() > 0 && row.attemptsUsed() >= row.maxAttempts()) blocked = "ATTEMPT_LIMIT_REACHED";
        return new StudentExamResponse(row.assignmentId(), row.examId(), row.title(), row.code(), row.description(),
                row.assignmentType(), classes, row.openTime(), row.closeTime(), row.timeLimit(), row.maxAttempts(),
                row.attemptsUsed(), row.attemptId(), row.attemptStatus(), blocked == null && !inProgress,
                blocked == null && inProgress, blocked);
    }
}
