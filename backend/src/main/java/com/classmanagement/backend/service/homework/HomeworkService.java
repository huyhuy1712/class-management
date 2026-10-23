package com.classmanagement.backend.service.homework;

import com.classmanagement.backend.dto.homework.HomeworkDtos;
import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.ClassroomStatus;
import com.classmanagement.backend.entity.enums.MaterialAssignmentType;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import com.classmanagement.backend.repository.classroom.ClassroomRepository;
import com.classmanagement.backend.service.StorageService;
import com.classmanagement.backend.service.impl.material.MaterialAssignmentManager;
import com.classmanagement.backend.service.impl.material.MaterialDistribution;
import com.classmanagement.backend.service.impl.material.MaterialFileSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
public class HomeworkService {
    private static final long MAX_PROMPT_FILE_SIZE = 10L * 1024 * 1024;
    private static final long MAX_AUDIO_SIZE = 10L * 1024 * 1024;
    private static final long MAX_IMAGE_SIZE = 5L * 1024 * 1024;
    private static final int MAX_IMAGES = 5;
    private static final int MAX_SCORE = 1000;
    private static final Set<String> PROMPT_EXTENSIONS = Set.of("pdf", "doc", "docx", "jpg", "jpeg", "png");
    private static final Set<String> IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png");
    private static final Set<String> AUDIO_EXTENSIONS = Set.of("mp3", "wav", "m4a", "aac", "ogg", "webm");

    private final JdbcTemplate jdbc;
    private final UserRepository users;
    private final ClassroomRepository classrooms;
    private final ClassStudentRepository classStudents;
    private final MaterialAssignmentManager assignmentManager;
    private final MaterialFileSupport materialFileSupport;
    private final StorageService storage;

    @Transactional
    public HomeworkDtos.Assignment create(
            String username,
            String title,
            String instructions,
            Long subjectId,
            String gradeLevel,
            String purpose,
            MaterialAssignmentType assignmentType,
            List<Long> classIds,
            List<Long> studentIds,
            String dueAtValue,
            String maxScoreValue,
            MultipartFile file,
            MultipartFile audioFile) {
        User teacher = user(username, UserRole.TEACHER);
        String normalizedTitle = title == null ? "" : title.trim();
        String normalizedInstructions = instructions == null ? "" : instructions.trim();
        if (normalizedTitle.isEmpty() || normalizedTitle.length() > 255)
            throw new IllegalArgumentException("Tên bài tập không được để trống và tối đa 255 ký tự");
        if (normalizedInstructions.length() > 50000)
            throw new IllegalArgumentException("Nội dung bài tập tối đa 50.000 ký tự");
        if (subjectId == null || subjectId <= 0 || !Boolean.TRUE.equals(
                jdbc.queryForObject("SELECT EXISTS (SELECT 1 FROM subjects WHERE id = ?)", Boolean.class, subjectId)))
            throw new IllegalArgumentException("Vui lòng chọn môn học hợp lệ");
        String normalizedGradeLevel = gradeLevel == null ? "" : gradeLevel.trim();
        if (!Set.of("10", "11", "12", "UNIVERSITY", "OTHER").contains(normalizedGradeLevel))
            throw new IllegalArgumentException("Vui lòng chọn khối / cấp độ hợp lệ");
        String normalizedPurpose = normalize(purpose);
        if (normalizedPurpose != null && normalizedPurpose.length() > 50)
            throw new IllegalArgumentException("Mục đích tối đa 50 ký tự");
        if (normalizedInstructions.isEmpty() && (file == null || file.isEmpty())
                && (audioFile == null || audioFile.isEmpty()))
            throw new IllegalArgumentException("Hãy nhập nội dung hoặc đính kèm tệp bài tập");
        LocalDateTime dueAt = parseDate(dueAtValue);
        if (dueAt != null && !dueAt.isAfter(now()))
            throw new IllegalArgumentException("Hạn nộp phải ở tương lai");
        BigDecimal maxScore = parseScore(maxScoreValue);
        MaterialDistribution distribution = assignmentManager.validateDistribution(
                teacher.getId(), assignmentType, classIds, studentIds);
        RecipientSnapshot recipients = resolveRecipients(teacher.getId(), assignmentType, distribution);

        UploadedFile uploaded = null;
        UploadedFile uploadedAudio = null;
        try {
            uploaded = file == null || file.isEmpty() ? null : uploadPrompt(teacher.getId(), file);
            uploadedAudio = audioFile == null || audioFile.isEmpty() ? null : uploadAudio(
                    "homework/teachers/" + teacher.getId(), "prompt-audio", audioFile);
            long assignmentId = jdbc.queryForObject("""
                    INSERT INTO homework_assignments
                        (teacher_id, title, instructions, subject_id, grade_level, purpose,
                         attachment_path, attachment_name,
                         attachment_size, attachment_content_type, audio_path, audio_name, audio_size,
                         audio_content_type, assignment_type, due_at, max_score, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')
                    RETURNING id
                    """, Long.class,
                    teacher.getId(), normalizedTitle,
                    normalizedInstructions.isEmpty() ? null : normalizedInstructions,
                    subjectId, normalizedGradeLevel, normalizedPurpose,
                    uploaded == null ? null : uploaded.path(),
                    uploaded == null ? null : uploaded.name(),
                    uploaded == null ? null : uploaded.size(),
                    uploaded == null ? null : uploaded.contentType(),
                    uploadedAudio == null ? null : uploadedAudio.path(),
                    uploadedAudio == null ? null : uploadedAudio.name(),
                    uploadedAudio == null ? null : uploadedAudio.size(),
                    uploadedAudio == null ? null : uploadedAudio.contentType(),
                    assignmentType.name(), dueAt, maxScore);

            if (assignmentType == MaterialAssignmentType.CLASS) {
                for (Classroom classroom : distribution.classrooms()) {
                    jdbc.update("INSERT INTO homework_assignment_classes (assignment_id, class_id) VALUES (?, ?)",
                            assignmentId, classroom.getId());
                }
            }
            if (assignmentType == MaterialAssignmentType.STUDENT) {
                Map<Long, Long> studentClasses = distribution.studentClassIds();
                for (Long studentId : distribution.students().stream().map(User::getId).toList()) {
                    jdbc.update("""
                            INSERT INTO homework_assignment_students (assignment_id, student_id, class_id)
                            VALUES (?, ?, ?)
                            """, assignmentId, studentId, studentClasses.get(studentId));
                }
            }
            for (var recipient : recipients.students().entrySet()) {
                jdbc.update("""
                        INSERT INTO homework_assignment_recipients (assignment_id, student_id, class_id)
                        VALUES (?, ?, ?)
                        """, assignmentId, recipient.getKey(), recipient.getValue());
                for (Long classId : recipients.classes().getOrDefault(recipient.getKey(), Set.of())) {
                    jdbc.update("""
                            INSERT INTO homework_assignment_recipient_classes (assignment_id, student_id, class_id)
                            VALUES (?, ?, ?)
                            """, assignmentId, recipient.getKey(), classId);
                }
            }
            return teacherAssignment(assignmentId, teacher.getId());
        } catch (RuntimeException error) {
            deleteUploaded(uploaded, error);
            deleteUploaded(uploadedAudio, error);
            throw error;
        }
    }

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
        List<HomeworkDtos.Submission> rows = jdbc.query("""
                SELECT s.id, r.student_id, u.full_name, u.student_code, s.status, s.answer_text,
                       s.submitted_at, s.score, s.teacher_comment, s.resubmission_count,
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
                    rs.getString("audio_name"),
                    audioUrl(rs.getString("audio_path")),
                    localDate(rs, "submitted_at"),
                    rs.getBigDecimal("score"),
                    rs.getString("teacher_comment"),
                    rs.getInt("resubmission_count"));
        }, parameters);
        return rows;
    }

    @Transactional
    public HomeworkDtos.Assignment updateDeadline(long assignmentId, LocalDateTime dueAt, String username) {
        User teacher = user(username, UserRole.TEACHER);
        requireOwnedAssignment(assignmentId, teacher.getId());
        if (dueAt != null && !dueAt.isAfter(now()))
            throw new IllegalArgumentException("Hạn nộp mới phải ở tương lai");
        jdbc.update("""
                UPDATE homework_assignments
                SET due_at = ?, status = 'OPEN', updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """, dueAt, assignmentId);
        return teacherAssignment(assignmentId, teacher.getId());
    }

    @Transactional
    public void reopen(long assignmentId, long studentId, String username) {
        User teacher = user(username, UserRole.TEACHER);
        requireOwnedAssignment(assignmentId, teacher.getId());
        int updated = jdbc.update("""
                UPDATE homework_submissions s
                SET status = 'REOPENED', score = NULL, teacher_comment = NULL, graded_at = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE s.assignment_id = ? AND s.student_id = ?
                  AND s.status IN ('SUBMITTED', 'GRADED')
                  AND EXISTS (
                      SELECT 1 FROM homework_assignment_recipients r
                      WHERE r.assignment_id = s.assignment_id AND r.student_id = s.student_id
                  )
                """, assignmentId, studentId);
        if (updated == 0) throw new IllegalArgumentException("Không tìm thấy bài nộp cần mở lại");
    }

    @Transactional
    public HomeworkDtos.Submission grade(
            long assignmentId, long studentId, HomeworkDtos.GradeRequest request, String username) {
        User teacher = user(username, UserRole.TEACHER);
        HomeworkDtos.Assignment assignment = teacherAssignment(assignmentId, teacher.getId());
        if (request == null || request.score() == null || request.score().signum() < 0
                || request.score().compareTo(assignment.maxScore()) > 0)
            throw new IllegalArgumentException("Điểm phải nằm trong khoảng 0 đến điểm tối đa của bài tập");
        if (request.teacherComment() != null && request.teacherComment().length() > 10000)
            throw new IllegalArgumentException("Nhận xét tối đa 10.000 ký tự");
        int updated = jdbc.update("""
                UPDATE homework_submissions
                SET status = 'GRADED', score = ?, teacher_comment = ?, graded_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE assignment_id = ? AND student_id = ? AND status = 'SUBMITTED'
                """, request.score(), normalize(request.teacherComment()), assignmentId, studentId);
        if (updated == 0) throw new IllegalArgumentException("Chỉ có thể chấm bài đã nộp");
        return submissions(assignmentId, null, username).stream()
                .filter(row -> row.studentId() == studentId)
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài nộp"));
    }

    @Transactional(readOnly = true)
    public List<HomeworkDtos.StudentAssignment> listForStudent(String username) {
        User student = user(username, UserRole.STUDENT);
        List<HomeworkDtos.StudentAssignment> result = jdbc.query("""
                SELECT h.id, h.title, h.instructions, h.subject_id,
                       (SELECT subj.name FROM subjects subj WHERE subj.id = h.subject_id) subject_name,
                       h.grade_level, h.purpose, h.assignment_type, h.due_at, h.max_score,
                       h.status, h.attachment_name, h.attachment_path, h.audio_name, h.audio_path, h.created_at,
                       (SELECT COUNT(*) FROM homework_assignment_recipients r WHERE r.assignment_id = h.id) recipient_count,
                       (SELECT COUNT(*) FROM homework_submissions s WHERE s.assignment_id = h.id) submitted_count,
                       (SELECT COUNT(*) FROM homework_submissions s WHERE s.assignment_id = h.id AND s.status = 'GRADED') graded_count,
                       s.id submission_id, s.status submission_status, s.answer_text, s.submitted_at,
                       s.score, s.teacher_comment, s.resubmission_count,
                       sa.original_name submission_audio_name, sa.object_path submission_audio_path
                FROM homework_assignment_recipients r
                JOIN homework_assignments h ON h.id = r.assignment_id
                LEFT JOIN homework_submissions s
                  ON s.assignment_id = h.id AND s.student_id = r.student_id
                LEFT JOIN homework_submission_audio sa ON sa.submission_id = s.id
                WHERE r.student_id = ?
                ORDER BY h.created_at DESC, h.id DESC
                """, (rs, row) -> studentAssignment(rs), student.getId());
        return result;
    }

    @Transactional(readOnly = true)
    public HomeworkDtos.StudentAssignment getForStudent(long assignmentId, String username) {
        User student = user(username, UserRole.STUDENT);
        return jdbc.query("""
                SELECT h.id, h.title, h.instructions, h.subject_id,
                       (SELECT subj.name FROM subjects subj WHERE subj.id = h.subject_id) subject_name,
                       h.grade_level, h.purpose, h.assignment_type, h.due_at, h.max_score,
                       h.status, h.attachment_name, h.attachment_path, h.audio_name, h.audio_path, h.created_at,
                       (SELECT COUNT(*) FROM homework_assignment_recipients r WHERE r.assignment_id = h.id) recipient_count,
                       (SELECT COUNT(*) FROM homework_submissions s WHERE s.assignment_id = h.id) submitted_count,
                       (SELECT COUNT(*) FROM homework_submissions s WHERE s.assignment_id = h.id AND s.status = 'GRADED') graded_count,
                       s.id submission_id, s.status submission_status, s.answer_text, s.submitted_at,
                       s.score, s.teacher_comment, s.resubmission_count,
                       sa.original_name submission_audio_name, sa.object_path submission_audio_path
                FROM homework_assignment_recipients r
                JOIN homework_assignments h ON h.id = r.assignment_id
                LEFT JOIN homework_submissions s
                  ON s.assignment_id = h.id AND s.student_id = r.student_id
                LEFT JOIN homework_submission_audio sa ON sa.submission_id = s.id
                WHERE r.assignment_id = ? AND r.student_id = ?
                """, (rs, row) -> studentAssignment(rs), assignmentId, student.getId())
                .stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài tập được giao cho bạn"));
    }

    @Transactional
    public HomeworkDtos.StudentAssignment submit(
            long assignmentId, String username, String answerText, List<MultipartFile> requestedImages,
            MultipartFile requestedAudio) {
        User student = user(username, UserRole.STUDENT);
        AssignmentGate gate = jdbc.query("""
                SELECT h.status assignment_status, h.due_at, s.id submission_id, s.status submission_status
                FROM homework_assignment_recipients r
                JOIN homework_assignments h ON h.id = r.assignment_id
                LEFT JOIN homework_submissions s
                  ON s.assignment_id = h.id AND s.student_id = r.student_id
                WHERE r.assignment_id = ? AND r.student_id = ?
                FOR UPDATE OF r
                """, (rs, row) -> new AssignmentGate(
                rs.getString("assignment_status"),
                localDate(rs, "due_at"),
                nullableLong(rs, "submission_id"),
                rs.getString("submission_status")), assignmentId, student.getId())
                .stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài tập được giao cho bạn"));

        String text = normalize(answerText);
        if (text != null && text.length() > 50000)
            throw new IllegalArgumentException("Câu trả lời tối đa 50.000 ký tự");
        List<MultipartFile> images = (requestedImages == null ? List.<MultipartFile>of() : requestedImages)
                .stream().filter(file -> file != null && !file.isEmpty()).toList();
        boolean hasAudio = requestedAudio != null && !requestedAudio.isEmpty();
        if (text == null && images.isEmpty() && !hasAudio)
            throw new IllegalArgumentException("Hãy nhập câu trả lời hoặc đính kèm ảnh/âm thanh bài làm");
        if (images.size() > MAX_IMAGES)
            throw new IllegalArgumentException("Mỗi lần nộp tối đa " + MAX_IMAGES + " ảnh");

        boolean reopened = "REOPENED".equals(gate.submissionStatus());
        if (!"OPEN".equals(gate.assignmentStatus()) && !reopened)
            throw new IllegalArgumentException("Bài tập đã đóng, không thể nộp bài");
        if (gate.dueAt() != null && !gate.dueAt().isAfter(now()) && !reopened)
            throw new IllegalArgumentException("Đã quá hạn nộp bài");
        if ("GRADED".equals(gate.submissionStatus()))
            throw new IllegalArgumentException("Bài đã được chấm; cần giáo viên mở lại trước khi nộp lại");

        List<UploadedFile> uploaded = uploadImages(assignmentId, student.getId(), images);
        UploadedFile uploadedAudio = null;
        try {
            if (hasAudio) {
                uploadedAudio = uploadAudio(
                        "homework/submissions/" + assignmentId + "/" + student.getId(),
                        "answer-audio", requestedAudio);
            }
            long submissionId;
            if (gate.submissionId() == null) {
                submissionId = jdbc.queryForObject("""
                        INSERT INTO homework_submissions (assignment_id, student_id, answer_text, status)
                        VALUES (?, ?, ?, 'SUBMITTED')
                        RETURNING id
                        """, Long.class, assignmentId, student.getId(), text);
            } else {
                jdbc.update("""
                        UPDATE homework_submissions
                        SET answer_text = ?, status = 'SUBMITTED', submitted_at = CURRENT_TIMESTAMP,
                            score = NULL, teacher_comment = NULL, graded_at = NULL,
                            resubmission_count = resubmission_count + 1, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                        """, text, gate.submissionId());
                submissionId = gate.submissionId();
            }
            if (!uploaded.isEmpty()) {
                List<String> oldPaths = jdbc.query(
                        "SELECT object_path FROM homework_submission_images WHERE submission_id = ?",
                        (rs, row) -> rs.getString(1), submissionId);
                jdbc.update("DELETE FROM homework_submission_images WHERE submission_id = ?", submissionId);
                for (int index = 0; index < uploaded.size(); index++) {
                    UploadedFile image = uploaded.get(index);
                    jdbc.update("""
                            INSERT INTO homework_submission_images
                                (submission_id, object_path, original_name, content_type, file_size, order_index)
                            VALUES (?, ?, ?, ?, ?, ?)
                            """, submissionId, image.path(), image.name(), image.contentType(), image.size(), index + 1);
                }
                oldPaths.forEach(materialFileSupport::scheduleDelete);
            }
            if (uploadedAudio != null) {
                List<String> oldAudioPaths = jdbc.query(
                        "SELECT object_path FROM homework_submission_audio WHERE submission_id = ?",
                        (rs, row) -> rs.getString(1), submissionId);
                jdbc.update("DELETE FROM homework_submission_audio WHERE submission_id = ?", submissionId);
                jdbc.update("""
                        INSERT INTO homework_submission_audio
                            (submission_id, object_path, original_name, content_type, file_size)
                        VALUES (?, ?, ?, ?, ?)
                        """, submissionId, uploadedAudio.path(), uploadedAudio.name(),
                        uploadedAudio.contentType(), uploadedAudio.size());
                oldAudioPaths.forEach(materialFileSupport::scheduleDelete);
            }
            return getForStudent(assignmentId, username);
        } catch (RuntimeException error) {
            uploaded.forEach(item -> deleteUploaded(item, error));
            deleteUploaded(uploadedAudio, error);
            throw error;
        }
    }

    private RecipientSnapshot resolveRecipients(
            Long teacherId, MaterialAssignmentType type, MaterialDistribution distribution) {
        Map<Long, Long> result = new LinkedHashMap<>();
        Map<Long, Set<Long>> recipientClasses = new LinkedHashMap<>();
        if (type == MaterialAssignmentType.STUDENT) {
            result.putAll(distribution.studentClassIds());
            distribution.studentClassIds().forEach((studentId, classId) ->
                    recipientClasses.computeIfAbsent(studentId, ignored -> new LinkedHashSet<>()).add(classId));
            return new RecipientSnapshot(result, recipientClasses);
        }

        List<Classroom> targets = type == MaterialAssignmentType.ALL
                ? classrooms.findAllByTeacher_Id(teacherId).stream()
                        .filter(room -> room.getStatus() == ClassroomStatus.ACTIVE).toList()
                : distribution.classrooms();
        if (targets.isEmpty())
            throw new IllegalArgumentException("Không có lớp đang hoạt động để giao bài tập");
        for (Classroom classroom : targets) {
            for (var membership : classStudents.findAllByClassroomId(classroom.getId())) {
                User student = membership.getStudent();
                if (student.getRole() == UserRole.STUDENT && student.getStatus() == UserStatus.ACTIVE) {
                    result.putIfAbsent(student.getId(), classroom.getId());
                    recipientClasses.computeIfAbsent(student.getId(), ignored -> new LinkedHashSet<>())
                            .add(classroom.getId());
                }
            }
        }
        if (result.isEmpty())
            throw new IllegalArgumentException("Không tìm thấy học sinh đang hoạt động trong phạm vi đã chọn");
        return new RecipientSnapshot(result, recipientClasses);
    }

    private HomeworkDtos.Assignment teacherAssignment(long id, Long teacherId) {
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
                rs.getString("submission_audio_name"),
                audioUrl(rs.getString("submission_audio_path")),
                localDate(rs, "submitted_at"),
                "GRADED".equals(status) ? rs.getBigDecimal("score") : null,
                "GRADED".equals(status) ? rs.getString("teacher_comment") : null,
                rs.getInt("resubmission_count"));
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

    private String audioUrl(String path) {
        return path == null ? null : storage.getUrl(path);
    }

    private void requireOwnedAssignment(long id, Long teacherId) {
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

    private UploadedFile uploadPrompt(Long teacherId, MultipartFile file) {
        String extension = extension(file.getOriginalFilename());
        if (!PROMPT_EXTENSIONS.contains(extension))
            throw new IllegalArgumentException("Tệp bài tập chỉ hỗ trợ PDF, DOC, DOCX, JPG hoặc PNG");
        if (file.getSize() > MAX_PROMPT_FILE_SIZE)
            throw new IllegalArgumentException("Tệp bài tập không được vượt quá 10 MB");
        String name = safeName(file.getOriginalFilename());
        String type = contentType(extension);
        String path = storage.upload("homework/teachers/" + teacherId + "/" + UUID.randomUUID(),
                "prompt." + extension, typed(file, type));
        return new UploadedFile(path, name, type, file.getSize());
    }

    private UploadedFile uploadAudio(String directory, String storedName, MultipartFile file) {
        String extension = extension(file.getOriginalFilename());
        if (!AUDIO_EXTENSIONS.contains(extension))
            throw new IllegalArgumentException("Tệp âm thanh chỉ hỗ trợ MP3, WAV, M4A, AAC, OGG hoặc WEBM");
        if (file.getSize() > MAX_AUDIO_SIZE)
            throw new IllegalArgumentException("Tệp âm thanh không được vượt quá 10 MB");
        String name = safeName(file.getOriginalFilename());
        String type = contentType(extension);
        String path = storage.upload(directory + "/" + UUID.randomUUID(),
                storedName + "." + extension, typed(file, type));
        return new UploadedFile(path, name, type, file.getSize());
    }

    private List<UploadedFile> uploadImages(long assignmentId, Long studentId, List<MultipartFile> images) {
        List<UploadedFile> uploaded = new ArrayList<>();
        try {
            for (MultipartFile image : images) {
                String extension = extension(image.getOriginalFilename());
                if (!IMAGE_EXTENSIONS.contains(extension))
                    throw new IllegalArgumentException("Ảnh bài làm chỉ hỗ trợ JPG hoặc PNG");
                if (image.getSize() > MAX_IMAGE_SIZE)
                    throw new IllegalArgumentException("Mỗi ảnh bài làm không được vượt quá 5 MB");
                String type = contentType(extension);
                String path = storage.upload(
                        "homework/submissions/" + assignmentId + "/" + studentId + "/" + UUID.randomUUID(),
                        "answer." + extension, typed(image, type));
                uploaded.add(new UploadedFile(path, safeName(image.getOriginalFilename()), type, image.getSize()));
            }
            return uploaded;
        } catch (RuntimeException error) {
            uploaded.forEach(item -> deleteUploaded(item, error));
            throw error;
        }
    }

    private static MultipartFile typed(MultipartFile file, String contentType) {
        return new TypedMultipartFile(file, contentType);
    }

    private static String extension(String filename) {
        String base = filename == null ? "" : filename.replace('\\', '/');
        int dot = base.lastIndexOf('.');
        return dot < base.lastIndexOf('/') ? "" : base.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private static String safeName(String filename) {
        String base = filename == null ? "file" : filename.replace('\\', '/');
        String name = base.substring(base.lastIndexOf('/') + 1).trim();
        if (name.isEmpty() || name.length() > 255)
            throw new IllegalArgumentException("Tên tệp không hợp lệ hoặc vượt quá 255 ký tự");
        return name;
    }

    private static String contentType(String extension) {
        return switch (extension) {
            case "pdf" -> "application/pdf";
            case "doc" -> "application/msword";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            case "mp3" -> "audio/mpeg";
            case "wav" -> "audio/wav";
            case "m4a" -> "audio/mp4";
            case "aac" -> "audio/aac";
            case "ogg" -> "audio/ogg";
            case "webm" -> "audio/webm";
            default -> "application/octet-stream";
        };
    }

    private void deleteUploaded(UploadedFile file, RuntimeException original) {
        if (file == null) return;
        try {
            storage.delete(file.path());
        } catch (RuntimeException cleanupError) {
            original.addSuppressed(cleanupError);
        }
    }

    private static LocalDateTime parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDateTime.parse(value);
        } catch (RuntimeException error) {
            throw new IllegalArgumentException("Hạn nộp không hợp lệ", error);
        }
    }

    private static BigDecimal parseScore(String value) {
        try {
            BigDecimal score = new BigDecimal(value);
            if (score.signum() < 0 || score.compareTo(BigDecimal.valueOf(MAX_SCORE)) > 0)
                throw new IllegalArgumentException("Điểm tối đa phải nằm trong khoảng 0 đến 1000");
            return score;
        } catch (NumberFormatException error) {
            throw new IllegalArgumentException("Điểm tối đa không hợp lệ", error);
        }
    }

    private static String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static LocalDateTime now() {
        return LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
    }

    private static Long nullableLong(ResultSet rs, String column) throws SQLException {
        long value = rs.getLong(column);
        return rs.wasNull() ? null : value;
    }

    private static LocalDateTime localDate(ResultSet rs, String column) throws SQLException {
        java.sql.Timestamp value = rs.getTimestamp(column);
        return value == null ? null : value.toLocalDateTime();
    }

    private record UploadedFile(String path, String name, String contentType, long size) {}
    private record RecipientSnapshot(Map<Long, Long> students, Map<Long, Set<Long>> classes) {}

    private record AssignmentGate(
            String assignmentStatus,
            LocalDateTime dueAt,
            Long submissionId,
            String submissionStatus) {}

    private record TypedMultipartFile(MultipartFile delegate, String contentType) implements MultipartFile {
        @Override public String getName() { return delegate.getName(); }
        @Override public String getOriginalFilename() { return delegate.getOriginalFilename(); }
        @Override public String getContentType() { return contentType; }
        @Override public boolean isEmpty() { return delegate.isEmpty(); }
        @Override public long getSize() { return delegate.getSize(); }
        @Override public byte[] getBytes() throws IOException { return delegate.getBytes(); }
        @Override public InputStream getInputStream() throws IOException { return delegate.getInputStream(); }
        @Override public void transferTo(File destination) throws IOException, IllegalStateException {
            delegate.transferTo(destination);
        }
    }
}
