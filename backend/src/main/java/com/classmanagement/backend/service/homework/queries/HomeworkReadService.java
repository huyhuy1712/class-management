package com.classmanagement.backend.service.homework.queries;

import com.classmanagement.backend.dto.homework.HomeworkDtos;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HomeworkReadService {
    private final JdbcTemplate jdbc;
    private final UserRepository users;
    private final StorageService storage;

    @Transactional(readOnly = true)
    public List<HomeworkDtos.Assignment> listForTeacher(String username, Long classId) {
        User teacher = user(username, UserRole.TEACHER);
        if (classId == null) {
            return jdbc.query(assignmentSelect() + """
                    WHERE h.teacher_id = ?
                    GROUP BY h.id
                    ORDER BY h.created_at DESC, h.id DESC
                    """, (rs, row) -> assignment(rs), teacher.getId());
        }
        requireTeacherClass(classId, teacher.getId());
        return jdbc.query(assignmentSelect(classId) + """
                WHERE h.teacher_id = ?
                  AND (
                    (h.assignment_type = 'ALL')
                    OR (h.assignment_type = 'CLASS' AND EXISTS (
                        SELECT 1 FROM homework_assignment_classes hc
                        WHERE hc.assignment_id = h.id AND hc.class_id = ?
                    ))
                    OR (h.assignment_type = 'STUDENT' AND EXISTS (
                        SELECT 1 FROM homework_assignment_students hs
                        WHERE hs.assignment_id = h.id AND hs.class_id = ?
                    ))
                  )
                GROUP BY h.id
                ORDER BY h.created_at DESC, h.id DESC
                """, (rs, row) -> assignment(rs), classId, teacher.getId(), classId, classId);
    }

    @Transactional(readOnly = true)
    public HomeworkDtos.Assignment getForTeacher(long assignmentId, String username) {
        User teacher = user(username, UserRole.TEACHER);
        return teacherAssignment(assignmentId, teacher.getId());
    }

    @Transactional(readOnly = true)
    public List<HomeworkDtos.Submission> submissions(long assignmentId, Long classId, String username) {
        User teacher = user(username, UserRole.TEACHER);
        requireOwnedAssignment(assignmentId, teacher.getId());
        if (classId != null) requireTeacherClass(classId, teacher.getId());
        String classFilter = classId == null ? "" : """
                  AND EXISTS (
                      SELECT 1 FROM homework_assignment_recipient_classes rc
                      WHERE rc.assignment_id = r.assignment_id
                        AND rc.student_id = r.student_id AND rc.class_id = ?
                  )
                """;
        Object[] parameters = classId == null
                ? new Object[] { assignmentId }
                : new Object[] { assignmentId, classId };
        return jdbc.query("""
                SELECT s.id, r.student_id, u.full_name, u.student_code, u.avatar student_avatar,
                       s.status, s.answer_text,
                       s.submitted_at, s.score, s.teacher_comment,
                       sa.original_name audio_name, sa.object_path audio_path
                FROM homework_assignment_recipients r
                JOIN users u ON u.id = r.student_id
                LEFT JOIN homework_submissions s
                  ON s.assignment_id = r.assignment_id AND s.student_id = r.student_id
                LEFT JOIN homework_submission_audio sa ON sa.submission_id = s.id
                WHERE r.assignment_id = ?
                """ + classFilter + """
                ORDER BY u.full_name, u.id
                """, (rs, row) -> {
            long submissionId = rs.getLong("id");
            Long id = rs.wasNull() ? null : submissionId;
            return new HomeworkDtos.Submission(
                    id == null ? 0 : id,
                    rs.getLong("student_id"),
                    rs.getString("full_name"),
                    rs.getString("student_code"),
                    rs.getString("status") == null ? "NOT_SUBMITTED" : rs.getString("status"),
                    rs.getString("answer_text"),
                    id == null ? List.of() : images(id),
                    id == null ? List.of() : files(id),
                    rs.getString("audio_name"),
                    audioUrl(rs.getString("audio_path")),
                    localDate(rs, "submitted_at"),
                    rs.getBigDecimal("score"),
                    rs.getString("teacher_comment"),
                    avatarUrl(rs.getString("student_avatar")));
        }, parameters);
    }

    @Transactional(readOnly = true)
    public HomeworkDtos.StudentClassSummary studentClassSummary(
            long classId, long studentId, String username) {
        User teacher = user(username, UserRole.TEACHER);
        return jdbc.query("""
                SELECT COUNT(a.id) AS total,
                       COUNT(a.id) FILTER (WHERE s.id IS NULL) AS not_submitted,
                       COUNT(a.id) FILTER (WHERE s.status = 'SUBMITTED') AS pending_grading,
                       COUNT(a.id) FILTER (WHERE s.status = 'GRADED') AS graded,
                       COUNT(a.id) FILTER (WHERE s.status = 'REOPENED') AS reopened,
                       ROUND(AVG(
                           CASE WHEN s.status = 'GRADED' AND a.max_score > 0
                                THEN s.score * 10.0 / a.max_score
                           END
                       ), 2) AS average_score_on_ten
                FROM classes c
                JOIN class_students cs
                  ON cs.class_id = c.id AND cs.student_id = ?
                JOIN users student
                  ON student.id = cs.student_id AND student.role = 'STUDENT'
                LEFT JOIN homework_assignment_recipient_classes rc
                  ON rc.class_id = c.id AND rc.student_id = cs.student_id
                LEFT JOIN homework_assignments a
                  ON a.id = rc.assignment_id
                LEFT JOIN homework_submissions s
                  ON s.assignment_id = a.id AND s.student_id = cs.student_id
                WHERE c.id = ? AND c.teacher_id = ?
                GROUP BY c.id
                """, (rs, row) -> new HomeworkDtos.StudentClassSummary(
                rs.getLong("total"),
                rs.getLong("not_submitted"),
                rs.getLong("pending_grading"),
                rs.getLong("graded"),
                rs.getLong("reopened"),
                rs.getBigDecimal("average_score_on_ten")),
                studentId, classId, teacher.getId())
                .stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học sinh trong lớp này"));
    }

    @Transactional(readOnly = true)
    public List<HomeworkDtos.StudentAssignment> listForStudent(String username) {
        return listForStudent(username, null);
    }

    @Transactional(readOnly = true)
    public List<HomeworkDtos.StudentAssignment> listForStudent(String username, Long classId) {
        User student = user(username, UserRole.STUDENT);
        if (classId != null && classId <= 0) {
            throw new IllegalArgumentException("Lớp học không hợp lệ");
        }
        String classFilter = classId == null ? "" : """
                  AND EXISTS (
                      SELECT 1 FROM homework_assignment_recipient_classes rc
                      WHERE rc.assignment_id = r.assignment_id
                        AND rc.student_id = r.student_id AND rc.class_id = ?
                  )
                """;
        Object[] parameters = classId == null
                ? new Object[] { student.getId() }
                : new Object[] { student.getId(), classId };
        return jdbc.query(studentAssignmentSelect() + """
                WHERE r.student_id = ?
                """ + classFilter + """
                ORDER BY h.created_at DESC, h.id DESC
                """, (rs, row) -> studentAssignment(rs), parameters);
    }

    @Transactional(readOnly = true)
    public HomeworkDtos.StudentAssignment getForStudent(long assignmentId, String username) {
        User student = user(username, UserRole.STUDENT);
        return jdbc.query(studentAssignmentSelect() + """
                WHERE r.assignment_id = ? AND r.student_id = ?
                """, (rs, row) -> studentAssignment(rs), assignmentId, student.getId())
                .stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài tập được giao cho bạn"));
    }

    public HomeworkDtos.Assignment teacherAssignment(long id, Long teacherId) {
        return jdbc.query(assignmentSelect() + """
                WHERE h.id = ? AND h.teacher_id = ?
                GROUP BY h.id
                """, (rs, row) -> assignment(rs), id, teacherId).stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài tập"));
    }

    private String assignmentSelect() {
        return assignmentSelect(null);
    }

    private String assignmentSelect(Long classId) {
        String recipientClassJoin = classId == null ? "" : """
                AND EXISTS (
                    SELECT 1 FROM homework_assignment_recipient_classes rc
                    WHERE rc.assignment_id = r.assignment_id
                      AND rc.student_id = r.student_id AND rc.class_id = ?
                )
                """;
        return """
                SELECT h.id, h.title, h.instructions, h.subject_id,
                       (SELECT subj.name FROM subjects subj WHERE subj.id = h.subject_id) subject_name,
                       h.grade_level, h.purpose, h.assignment_type, h.due_at, h.max_score,
                       h.status, h.attachment_name, h.attachment_path, h.audio_name, h.audio_path, h.created_at,
                       COUNT(DISTINCT r.student_id) recipient_count,
                       COUNT(DISTINCT s.student_id) submitted_count,
                       COUNT(DISTINCT CASE WHEN s.status = 'GRADED' THEN s.student_id END) graded_count
                FROM homework_assignments h
                LEFT JOIN homework_assignment_recipients r ON r.assignment_id = h.id
                """ + recipientClassJoin + """
                LEFT JOIN homework_submissions s ON s.assignment_id = h.id
                """;
    }

    private String studentAssignmentSelect() {
        return """
                SELECT h.id, h.title, h.instructions, h.subject_id,
                       (SELECT subj.name FROM subjects subj WHERE subj.id = h.subject_id) subject_name,
                       h.grade_level, h.purpose, h.assignment_type, h.due_at, h.max_score,
                       h.status, h.attachment_name, h.attachment_path, h.audio_name, h.audio_path, h.created_at,
                       (SELECT COUNT(*) FROM homework_assignment_recipients r WHERE r.assignment_id = h.id) recipient_count,
                       (SELECT COUNT(*) FROM homework_submissions s WHERE s.assignment_id = h.id) submitted_count,
                       (SELECT COUNT(*) FROM homework_submissions s WHERE s.assignment_id = h.id AND s.status = 'GRADED') graded_count,
                       s.id submission_id, s.status submission_status, s.answer_text, s.submitted_at,
                       s.score, s.teacher_comment,
                       sa.original_name submission_audio_name, sa.object_path submission_audio_path
                FROM homework_assignment_recipients r
                JOIN homework_assignments h ON h.id = r.assignment_id
                LEFT JOIN homework_submissions s
                  ON s.assignment_id = h.id AND s.student_id = r.student_id
                LEFT JOIN homework_submission_audio sa ON sa.submission_id = s.id
                """;
    }

    private void requireTeacherClass(long classId, Long teacherId) {
        if (classId <= 0 || !Boolean.TRUE.equals(jdbc.queryForObject("""
                SELECT EXISTS (
                    SELECT 1 FROM classes
                    WHERE id = ? AND teacher_id = ? AND status = 'ACTIVE'
                )
                """, Boolean.class, classId, teacherId))) {
            throw new ResourceNotFoundException("Không tìm thấy lớp đang hoạt động");
        }
    }

    public void requireOwnedAssignment(long id, Long teacherId) {
        if (!Boolean.TRUE.equals(jdbc.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM homework_assignments WHERE id = ? AND teacher_id = ?)",
                Boolean.class, id, teacherId)))
            throw new ResourceNotFoundException("Không tìm thấy bài tập");
    }

    private User user(String username, UserRole role) {
        User user = users.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        if (user.getRole() != role || user.getStatus() != UserStatus.ACTIVE)
            throw new IllegalStateException("Không có quyền sử dụng chức năng bài tập");
        return user;
    }

    public User requireUser(String username, UserRole role) {
        return user(username, role);
    }

    private HomeworkDtos.Assignment assignment(ResultSet rs) throws SQLException {
        String path = rs.getString("attachment_path");
        return new HomeworkDtos.Assignment(
                rs.getLong("id"),
                rs.getString("title"),
                rs.getString("instructions"),
                nullableLong(rs, "subject_id"),
                rs.getString("subject_name"),
                rs.getString("grade_level"),
                rs.getString("purpose"),
                rs.getString("assignment_type"),
                localDate(rs, "due_at"),
                rs.getBigDecimal("max_score"),
                rs.getString("status"),
                rs.getString("attachment_name"),
                path == null ? null : storage.getUrl(path),
                rs.getString("audio_name"),
                audioUrl(rs.getString("audio_path")),
                rs.getInt("recipient_count"),
                rs.getInt("submitted_count"),
                rs.getInt("graded_count"),
                localDate(rs, "created_at"));
    }

    private HomeworkDtos.StudentAssignment studentAssignment(ResultSet rs) throws SQLException {
        HomeworkDtos.Assignment assignment = assignment(rs);
        HomeworkDtos.Assignment studentVisibleAssignment = new HomeworkDtos.Assignment(
                assignment.id(), assignment.title(), assignment.instructions(),
                assignment.subjectId(), assignment.subjectName(), assignment.gradeLevel(), assignment.purpose(),
                assignment.assignmentType(),
                assignment.dueAt(), assignment.maxScore(), assignment.status(), assignment.attachmentName(),
                assignment.attachmentUrl(), assignment.audioName(), assignment.audioUrl(),
                0, 0, 0, assignment.createdAt());
        Long submissionId = nullableLong(rs, "submission_id");
        String status = rs.getString("submission_status");
        return new HomeworkDtos.StudentAssignment(
                studentVisibleAssignment,
                status == null ? "NOT_SUBMITTED" : status,
                rs.getString("answer_text"),
                submissionId == null ? List.of() : images(submissionId),
                submissionId == null ? List.of() : files(submissionId),
                rs.getString("submission_audio_name"),
                audioUrl(rs.getString("submission_audio_path")),
                localDate(rs, "submitted_at"),
                "GRADED".equals(status) ? rs.getBigDecimal("score") : null,
                "GRADED".equals(status) ? rs.getString("teacher_comment") : null);
    }

    private List<HomeworkDtos.Image> images(long submissionId) {
        return jdbc.query("""
                SELECT original_name, object_path, file_size
                FROM homework_submission_images WHERE submission_id = ? ORDER BY order_index
                """, (rs, row) -> new HomeworkDtos.Image(
                rs.getString("original_name"),
                storage.getUrl(rs.getString("object_path")),
                rs.getLong("file_size")), submissionId);
    }

    private List<HomeworkDtos.File> files(long submissionId) {
        return jdbc.query("""
                SELECT original_name, object_path, file_size, content_type
                FROM homework_submission_files WHERE submission_id = ? ORDER BY order_index
                """, (rs, row) -> new HomeworkDtos.File(
                rs.getString("original_name"),
                storage.getUrl(rs.getString("object_path")),
                rs.getLong("file_size"),
                rs.getString("content_type")), submissionId);
    }

    private String avatarUrl(String avatarPath) {
        return avatarPath == null || avatarPath.isBlank() ? null : storage.getUrl(avatarPath);
    }

    private String audioUrl(String path) {
        return path == null ? null : storage.getUrl(path);
    }

    private static Long nullableLong(ResultSet rs, String column) throws SQLException {
        long value = rs.getLong(column);
        return rs.wasNull() ? null : value;
    }

    private static java.time.LocalDateTime localDate(ResultSet rs, String column) throws SQLException {
        java.sql.Timestamp value = rs.getTimestamp(column);
        return value == null ? null : value.toLocalDateTime();
    }
}
