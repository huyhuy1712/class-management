package com.classmanagement.backend.service.homework;

import com.classmanagement.backend.dto.homework.HomeworkDtos;
import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.entity.Notification;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.ClassroomStatus;
import com.classmanagement.backend.entity.enums.NotificationType;
import com.classmanagement.backend.entity.enums.MaterialAssignmentType;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import com.classmanagement.backend.repository.classroom.ClassroomRepository;
import com.classmanagement.backend.repository.NotificationRepository;
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
    private static final long MAX_SUBMISSION_FILE_SIZE = 10L * 1024 * 1024;
    private static final int MAX_SUBMISSION_FILES = 5;
    private static final int MAX_SCORE = 1000;
    private static final Set<String> PROMPT_EXTENSIONS = Set.of("pdf", "doc", "docx", "jpg", "jpeg", "png");
    private static final Set<String> IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png");
    private static final Set<String> AUDIO_EXTENSIONS = Set.of("mp3", "wav", "m4a", "aac", "ogg", "webm");
    private static final Set<String> SUBMISSION_FILE_EXTENSIONS = Set.of(
            "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "zip", "rar", "csv");

    private final JdbcTemplate jdbc;
    private final UserRepository users;
    private final ClassroomRepository classrooms;
    private final ClassStudentRepository classStudents;
    private final MaterialAssignmentManager assignmentManager;
    private final MaterialFileSupport materialFileSupport;
    private final NotificationRepository notificationRepository;
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
            throw new IllegalArgumentException("TĂªn bĂ i táº­p khĂ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng vĂ  tá»‘i Ä‘a 255 kĂ½ tá»±");
        if (normalizedInstructions.length() > 50000)
            throw new IllegalArgumentException("Ná»™i dung bĂ i táº­p tá»‘i Ä‘a 50.000 kĂ½ tá»±");
        if (subjectId == null || subjectId <= 0 || !Boolean.TRUE.equals(
                jdbc.queryForObject("SELECT EXISTS (SELECT 1 FROM subjects WHERE id = ?)", Boolean.class, subjectId)))
            throw new IllegalArgumentException("Vui lĂ²ng chá»n mĂ´n há»c há»£p lá»‡");
        String normalizedGradeLevel = gradeLevel == null ? "" : gradeLevel.trim();
        if (!Set.of("10", "11", "12", "UNIVERSITY", "OTHER").contains(normalizedGradeLevel))
            throw new IllegalArgumentException("Vui lĂ²ng chá»n khá»‘i / cáº¥p Ä‘á»™ há»£p lá»‡");
        String normalizedPurpose = normalize(purpose);
        if (normalizedPurpose != null && normalizedPurpose.length() > 50)
            throw new IllegalArgumentException("Má»¥c Ä‘Ă­ch tá»‘i Ä‘a 50 kĂ½ tá»±");
        if (normalizedInstructions.isEmpty() && (file == null || file.isEmpty())
                && (audioFile == null || audioFile.isEmpty()))
            throw new IllegalArgumentException("HĂ£y nháº­p ná»™i dung hoáº·c Ä‘Ă­nh kĂ¨m tá»‡p bĂ i táº­p");
        LocalDateTime dueAt = parseDate(dueAtValue);
        if (dueAt != null && !dueAt.isAfter(now()))
            throw new IllegalArgumentException("Háº¡n ná»™p pháº£i á»Ÿ tÆ°Æ¡ng lai");
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
            createNewHomeworkNotifications(assignmentId, normalizedTitle, recipients.students().keySet());
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
                    rs.getString("teacher_comment"));
        }, parameters);
        return rows;
    }

    @Transactional
    public HomeworkDtos.Assignment update(long assignmentId, String username, String title,
            String instructions, Long subjectId, String gradeLevel, String purpose,
            MaterialAssignmentType assignmentType, List<Long> classIds, List<Long> studentIds,
            String dueAtValue, String maxScoreValue, MultipartFile file, MultipartFile audioFile,
            boolean removeFile, boolean removeAudio) {
        User teacher = user(username, UserRole.TEACHER);
        requireOwnedAssignment(assignmentId, teacher.getId());

        String normalizedTitle = title == null ? "" : title.trim();
        String normalizedInstructions = instructions == null ? "" : instructions.trim();
        if (normalizedTitle.isEmpty() || normalizedTitle.length() > 255)
            throw new IllegalArgumentException("Tên bài tập không được để trống và tối đa 255 ký tự");
        if (normalizedInstructions.length() > 50000)
            throw new IllegalArgumentException("Nội dung bài tập tối đa 50.000 ký tự");
        if (subjectId == null || subjectId <= 0 || !Boolean.TRUE.equals(
                jdbc.queryForObject("SELECT EXISTS (SELECT 1 FROM subjects WHERE id = ?)", Boolean.class, subjectId)))
            throw new IllegalArgumentException("Vui lòng chọn môn học hợp lệ");
        if (!Set.of("10", "11", "12", "UNIVERSITY", "OTHER").contains(gradeLevel == null ? "" : gradeLevel))
            throw new IllegalArgumentException("Vui lòng chọn khối / cấp độ hợp lệ");
        String normalizedPurpose = normalize(purpose);
        if (normalizedPurpose != null && normalizedPurpose.length() > 50)
            throw new IllegalArgumentException("Mục đích tối đa 50 ký tự");

        LocalDateTime existingDueAt = jdbc.queryForObject("SELECT due_at FROM homework_assignments WHERE id = ?", LocalDateTime.class, assignmentId);
        LocalDateTime dueAt = parseDate(dueAtValue);
        if (dueAt != null && !dueAt.equals(existingDueAt) && !dueAt.isAfter(now()))
            throw new IllegalArgumentException("Hạn nộp mới phải ở tương lai");
        BigDecimal maxScore = parseScore(maxScoreValue);

        Map<String, Object> oldFiles = jdbc.queryForObject("""
                SELECT attachment_path, attachment_name, attachment_size, attachment_content_type,
                       audio_path, audio_name, audio_size, audio_content_type
                FROM homework_assignments WHERE id = ?
                """, (rs, rowNum) -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("attachmentPath", rs.getString("attachment_path"));
                    result.put("attachmentName", rs.getString("attachment_name"));
                    result.put("attachmentSize", rs.getObject("attachment_size"));
                    result.put("attachmentContentType", rs.getString("attachment_content_type"));
                    result.put("audioPath", rs.getString("audio_path"));
                    result.put("audioName", rs.getString("audio_name"));
                    result.put("audioSize", rs.getObject("audio_size"));
                    result.put("audioContentType", rs.getString("audio_content_type"));
                    return result;
                }, assignmentId);

        boolean hasFileAfterUpdate = !removeFile && (file != null && !file.isEmpty()
                || oldFiles.get("attachmentPath") != null);
        boolean hasAudioAfterUpdate = !removeAudio && (audioFile != null && !audioFile.isEmpty()
                || oldFiles.get("audioPath") != null);
        if (normalizedInstructions.isEmpty() && !hasFileAfterUpdate && !hasAudioAfterUpdate)
            throw new IllegalArgumentException("Hãy nhập nội dung hoặc đính kèm tệp bài tập");

        MaterialDistribution distribution = assignmentManager.validateDistribution(
                teacher.getId(), assignmentType, classIds, studentIds);
        RecipientSnapshot recipients = resolveRecipients(teacher.getId(), assignmentType, distribution);

        UploadedFile uploaded = null;
        UploadedFile uploadedAudio = null;
        try {
            uploaded = file == null || file.isEmpty() ? null : uploadPrompt(teacher.getId(), file);
            uploadedAudio = audioFile == null || audioFile.isEmpty() ? null : uploadAudio(
                    "homework/teachers/" + teacher.getId(), "prompt-audio", audioFile);

            String attachmentPath = uploaded != null ? uploaded.path() : removeFile ? null : (String) oldFiles.get("attachmentPath");
            String attachmentName = uploaded != null ? uploaded.name() : removeFile ? null : (String) oldFiles.get("attachmentName");
            Object attachmentSize = uploaded != null ? uploaded.size() : removeFile ? null : oldFiles.get("attachmentSize");
            String attachmentContentType = uploaded != null ? uploaded.contentType() : removeFile ? null : (String) oldFiles.get("attachmentContentType");
            String audioPath = uploadedAudio != null ? uploadedAudio.path() : removeAudio ? null : (String) oldFiles.get("audioPath");
            String audioName = uploadedAudio != null ? uploadedAudio.name() : removeAudio ? null : (String) oldFiles.get("audioName");
            Object audioSize = uploadedAudio != null ? uploadedAudio.size() : removeAudio ? null : oldFiles.get("audioSize");
            String audioContentType = uploadedAudio != null ? uploadedAudio.contentType() : removeAudio ? null : (String) oldFiles.get("audioContentType");

            jdbc.update("""
                    UPDATE homework_assignments SET
                        title = ?, instructions = ?, subject_id = ?, grade_level = ?, purpose = ?,
                        assignment_type = ?, due_at = ?, max_score = ?, status = 'OPEN', updated_at = CURRENT_TIMESTAMP,
                        attachment_path = ?, attachment_name = ?, attachment_size = ?, attachment_content_type = ?,
                        audio_path = ?, audio_name = ?, audio_size = ?, audio_content_type = ?
                    WHERE id = ?
                    """,
                    normalizedTitle, normalizedInstructions.isEmpty() ? null : normalizedInstructions,
                    subjectId, gradeLevel, normalizedPurpose, assignmentType.name(), dueAt, maxScore,
                    attachmentPath, attachmentName, attachmentSize, attachmentContentType,
                    audioPath, audioName, audioSize, audioContentType, assignmentId);

            jdbc.update("DELETE FROM homework_assignment_recipient_classes WHERE assignment_id = ?", assignmentId);
            jdbc.update("DELETE FROM homework_assignment_recipients WHERE assignment_id = ?", assignmentId);
            jdbc.update("DELETE FROM homework_assignment_classes WHERE assignment_id = ?", assignmentId);
            jdbc.update("DELETE FROM homework_assignment_students WHERE assignment_id = ?", assignmentId);

            if (assignmentType == MaterialAssignmentType.CLASS) {
                for (Classroom classroom : distribution.classrooms())
                    jdbc.update("INSERT INTO homework_assignment_classes (assignment_id, class_id) VALUES (?, ?)", assignmentId, classroom.getId());
            }
            if (assignmentType == MaterialAssignmentType.STUDENT) {
                Map<Long, Long> studentClasses = distribution.studentClassIds();
                for (Long studentId : distribution.students().stream().map(User::getId).toList())
                    jdbc.update("INSERT INTO homework_assignment_students (assignment_id, student_id, class_id) VALUES (?, ?, ?)", assignmentId, studentId, studentClasses.get(studentId));
            }
            for (var recipient : recipients.students().entrySet()) {
                jdbc.update("INSERT INTO homework_assignment_recipients (assignment_id, student_id, class_id) VALUES (?, ?, ?)",
                        assignmentId, recipient.getKey(), recipient.getValue());
                for (Long classId : recipients.classes().getOrDefault(recipient.getKey(), Set.of()))
                    jdbc.update("INSERT INTO homework_assignment_recipient_classes (assignment_id, student_id, class_id) VALUES (?, ?, ?)",
                            assignmentId, recipient.getKey(), classId);
            }

            String oldAttachmentPath = (String) oldFiles.get("attachmentPath");
            String oldAudioPath = (String) oldFiles.get("audioPath");
            if ((uploaded != null || removeFile) && oldAttachmentPath != null)
                storage.delete(oldAttachmentPath);
            if ((uploadedAudio != null || removeAudio) && oldAudioPath != null)
                storage.delete(oldAudioPath);
            return teacherAssignment(assignmentId, teacher.getId());
        } catch (RuntimeException error) {
            deleteUploaded(uploaded, error);
            deleteUploaded(uploadedAudio, error);
            throw error;
        }
    }

    @Transactional
    public void delete(long assignmentId, String username) {
        User teacher = user(username, UserRole.TEACHER);
        requireOwnedAssignment(assignmentId, teacher.getId());
        Map<String, String> files = jdbc.queryForObject("""
                SELECT attachment_path, audio_path FROM homework_assignments WHERE id = ?
                """, (rs, rowNum) -> Map.of(
                        "attachmentPath", rs.getString("attachment_path") == null ? "" : rs.getString("attachment_path"),
                        "audioPath", rs.getString("audio_path") == null ? "" : rs.getString("audio_path")), assignmentId);
        jdbc.update("DELETE FROM homework_assignments WHERE id = ?", assignmentId);
        if (!files.get("attachmentPath").isEmpty()) storage.delete(files.get("attachmentPath"));
        if (!files.get("audioPath").isEmpty()) storage.delete(files.get("audioPath"));
    }

    @Transactional
    public HomeworkDtos.Assignment updateDeadline(long assignmentId, LocalDateTime dueAt, String username) {
        User teacher = user(username, UserRole.TEACHER);
        requireOwnedAssignment(assignmentId, teacher.getId());
        if (dueAt != null && !dueAt.isAfter(now()))
            throw new IllegalArgumentException("Háº¡n ná»™p má»›i pháº£i á»Ÿ tÆ°Æ¡ng lai");
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
        if (updated == 0) throw new IllegalArgumentException("KhĂ´ng tĂ¬m tháº¥y bĂ i ná»™p cáº§n má»Ÿ láº¡i");
    }

    @Transactional
    public HomeworkDtos.Submission grade(
            long assignmentId, long studentId, HomeworkDtos.GradeRequest request, String username) {
        User teacher = user(username, UserRole.TEACHER);
        HomeworkDtos.Assignment assignment = teacherAssignment(assignmentId, teacher.getId());
        if (request == null || request.score() == null || request.score().signum() < 0
                || request.score().compareTo(assignment.maxScore()) > 0)
            throw new IllegalArgumentException("Äiá»ƒm pháº£i náº±m trong khoáº£ng 0 Ä‘áº¿n Ä‘iá»ƒm tá»‘i Ä‘a cá»§a bĂ i táº­p");
        if (request.teacherComment() != null && request.teacherComment().length() > 10000)
            throw new IllegalArgumentException("Nháº­n xĂ©t tá»‘i Ä‘a 10.000 kĂ½ tá»±");
        int updated = jdbc.update("""
                UPDATE homework_submissions
                SET status = 'GRADED', score = ?, teacher_comment = ?, graded_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE assignment_id = ? AND student_id = ? AND status = 'SUBMITTED'
                """, request.score(), normalize(request.teacherComment()), assignmentId, studentId);
        if (updated == 0) throw new IllegalArgumentException("Chá»‰ cĂ³ thá»ƒ cháº¥m bĂ i Ä‘Ă£ ná»™p");
        return submissions(assignmentId, null, username).stream()
                .filter(row -> row.studentId() == studentId)
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("KhĂ´ng tĂ¬m tháº¥y bĂ i ná»™p"));
    }

    @Transactional(readOnly = true)
    public List<HomeworkDtos.StudentAssignment> listForStudent(String username, Long classId) {
        User student = user(username, UserRole.STUDENT);
        if (classId != null && (classId <= 0 || !Boolean.TRUE.equals(jdbc.queryForObject("""
                SELECT EXISTS (
                    SELECT 1 FROM class_students cs
                    JOIN classes c ON c.id = cs.class_id
                    WHERE cs.class_id = ? AND cs.student_id = ? AND c.status = 'ACTIVE'
                )
                """, Boolean.class, classId, student.getId())))) {
            throw new ResourceNotFoundException("Không tìm thấy lớp đang hoạt động");
        }
        String classFilter = classId == null ? "" : """
                  AND EXISTS (
                      SELECT 1 FROM homework_assignment_recipient_classes rc
                      WHERE rc.assignment_id = h.id
                        AND rc.student_id = r.student_id AND rc.class_id = ?
                  )
                """;
        Object[] parameters = classId == null
                ? new Object[] { student.getId() }
                : new Object[] { student.getId(), classId };
        List<HomeworkDtos.StudentAssignment> result = jdbc.query("""
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
                WHERE r.student_id = ?
                """ + classFilter + """
                ORDER BY h.created_at DESC, h.id DESC
                """, (rs, row) -> studentAssignment(rs), parameters);
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
                       s.score, s.teacher_comment,
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
                .orElseThrow(() -> new ResourceNotFoundException("KhĂ´ng tĂ¬m tháº¥y bĂ i táº­p Ä‘Æ°á»£c giao cho báº¡n"));
    }

    @Transactional
    public HomeworkDtos.StudentAssignment submit(
            long assignmentId, String username, String answerText, List<MultipartFile> requestedImages,
            List<MultipartFile> requestedFiles, MultipartFile requestedAudio) {
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
                .orElseThrow(() -> new ResourceNotFoundException("KhĂ´ng tĂ¬m tháº¥y bĂ i táº­p Ä‘Æ°á»£c giao cho báº¡n"));

        String text = normalize(answerText);
        if (text != null && text.length() > 50000)
            throw new IllegalArgumentException("CĂ¢u tráº£ lá»i tá»‘i Ä‘a 50.000 kĂ½ tá»±");
        List<MultipartFile> images = (requestedImages == null ? List.<MultipartFile>of() : requestedImages)
                .stream().filter(file -> file != null && !file.isEmpty()).toList();
        List<MultipartFile> files = (requestedFiles == null ? List.<MultipartFile>of() : requestedFiles)
                .stream().filter(file -> file != null && !file.isEmpty()).toList();
        boolean hasAudio = requestedAudio != null && !requestedAudio.isEmpty();
        if (text == null && images.isEmpty() && files.isEmpty() && !hasAudio)
            throw new IllegalArgumentException("HĂ£y nháº­p cĂ¢u tráº£ lá»i hoáº·c Ä‘Ă­nh kĂ¨m áº£nh, tá»‡p hoáº·c Ă¢m thanh bĂ i lĂ m");
        if (images.size() > MAX_IMAGES)
            throw new IllegalArgumentException("Má»—i láº§n ná»™p tá»‘i Ä‘a " + MAX_IMAGES + " áº£nh");
        if (files.size() > MAX_SUBMISSION_FILES)
            throw new IllegalArgumentException("Má»—i láº§n ná»™p tá»‘i Ä‘a " + MAX_SUBMISSION_FILES + " tá»‡p");

        boolean reopened = "REOPENED".equals(gate.submissionStatus());
        if (!"OPEN".equals(gate.assignmentStatus()) && !reopened)
            throw new IllegalArgumentException("BĂ i táº­p Ä‘Ă£ Ä‘Ă³ng, khĂ´ng thá»ƒ ná»™p bĂ i");
        if (gate.dueAt() != null && !gate.dueAt().isAfter(now()) && !reopened)
            throw new IllegalArgumentException("ÄĂ£ quĂ¡ háº¡n ná»™p bĂ i");
        if ("GRADED".equals(gate.submissionStatus()))
            throw new IllegalArgumentException("BĂ i Ä‘Ă£ Ä‘Æ°á»£c cháº¥m; cáº§n giĂ¡o viĂªn má»Ÿ láº¡i trÆ°á»›c khi ná»™p láº¡i");

        List<UploadedFile> uploaded = uploadImages(assignmentId, student.getId(), images);
        List<UploadedFile> uploadedFiles = uploadSubmissionFiles(assignmentId, student.getId(), files);
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
                            updated_at = CURRENT_TIMESTAMP
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
            if (!uploadedFiles.isEmpty()) {
                List<String> oldFilePaths = jdbc.query(
                        "SELECT object_path FROM homework_submission_files WHERE submission_id = ?",
                        (rs, row) -> rs.getString(1), submissionId);
                jdbc.update("DELETE FROM homework_submission_files WHERE submission_id = ?", submissionId);
                for (int index = 0; index < uploadedFiles.size(); index++) {
                    UploadedFile file = uploadedFiles.get(index);
                    jdbc.update("""
                            INSERT INTO homework_submission_files
                                (submission_id, object_path, original_name, content_type, file_size, order_index)
                            VALUES (?, ?, ?, ?, ?, ?)
                            """, submissionId, file.path(), file.name(), file.contentType(), file.size(), index + 1);
                }
                oldFilePaths.forEach(materialFileSupport::scheduleDelete);
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
            uploadedFiles.forEach(item -> deleteUploaded(item, error));
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
            throw new IllegalArgumentException("KhĂ´ng cĂ³ lá»›p Ä‘ang hoáº¡t Ä‘á»™ng Ä‘á»ƒ giao bĂ i táº­p");
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
            throw new IllegalArgumentException("KhĂ´ng tĂ¬m tháº¥y há»c sinh Ä‘ang hoáº¡t Ä‘á»™ng trong pháº¡m vi Ä‘Ă£ chá»n");
        return new RecipientSnapshot(result, recipientClasses);
    }

    private HomeworkDtos.Assignment teacherAssignment(long id, Long teacherId) {
        return jdbc.query(assignmentSelect() + """
                WHERE h.id = ? AND h.teacher_id = ?
                GROUP BY h.id
                """, (rs, row) -> assignment(rs), id, teacherId).stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("KhĂ´ng tĂ¬m tháº¥y bĂ i táº­p"));
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
            throw new ResourceNotFoundException("KhĂ´ng tĂ¬m tháº¥y lá»›p Ä‘ang hoáº¡t Ä‘á»™ng");
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

    private String audioUrl(String path) {
        return path == null ? null : storage.getUrl(path);
    }

    private void requireOwnedAssignment(long id, Long teacherId) {
        if (!Boolean.TRUE.equals(jdbc.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM homework_assignments WHERE id = ? AND teacher_id = ?)",
                Boolean.class, id, teacherId)))
            throw new ResourceNotFoundException("KhĂ´ng tĂ¬m tháº¥y bĂ i táº­p");
    }

    private User user(String username, UserRole role) {
        User user = users.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("KhĂ´ng tĂ¬m tháº¥y ngÆ°á»i dĂ¹ng"));
        if (user.getRole() != role || user.getStatus() != UserStatus.ACTIVE)
            throw new IllegalStateException("KhĂ´ng cĂ³ quyá»n sá»­ dá»¥ng chá»©c nÄƒng bĂ i táº­p");
        return user;
    }

    private UploadedFile uploadPrompt(Long teacherId, MultipartFile file) {
        String extension = extension(file.getOriginalFilename());
        if (!PROMPT_EXTENSIONS.contains(extension))
            throw new IllegalArgumentException("Tá»‡p bĂ i táº­p chá»‰ há»— trá»£ PDF, DOC, DOCX, JPG hoáº·c PNG");
        if (file.getSize() > MAX_PROMPT_FILE_SIZE)
            throw new IllegalArgumentException("Tá»‡p bĂ i táº­p khĂ´ng Ä‘Æ°á»£c vÆ°á»£t quĂ¡ 10 MB");
        String name = safeName(file.getOriginalFilename());
        String type = contentType(extension);
        String path = storage.upload("homework/teachers/" + teacherId + "/" + UUID.randomUUID(),
                "prompt." + extension, typed(file, type));
        return new UploadedFile(path, name, type, file.getSize());
    }

    private UploadedFile uploadAudio(String directory, String storedName, MultipartFile file) {
        String extension = extension(file.getOriginalFilename());
        if (!AUDIO_EXTENSIONS.contains(extension))
            throw new IllegalArgumentException("Tá»‡p Ă¢m thanh chá»‰ há»— trá»£ MP3, WAV, M4A, AAC, OGG hoáº·c WEBM");
        if (file.getSize() > MAX_AUDIO_SIZE)
            throw new IllegalArgumentException("Tá»‡p Ă¢m thanh khĂ´ng Ä‘Æ°á»£c vÆ°á»£t quĂ¡ 10 MB");
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
                    throw new IllegalArgumentException("áº¢nh bĂ i lĂ m chá»‰ há»— trá»£ JPG hoáº·c PNG");
                if (image.getSize() > MAX_IMAGE_SIZE)
                    throw new IllegalArgumentException("Má»—i áº£nh bĂ i lĂ m khĂ´ng Ä‘Æ°á»£c vÆ°á»£t quĂ¡ 5 MB");
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

    private List<UploadedFile> uploadSubmissionFiles(long assignmentId, Long studentId, List<MultipartFile> files) {
        List<UploadedFile> uploaded = new ArrayList<>();
        try {
            for (MultipartFile file : files) {
                String extension = extension(file.getOriginalFilename());
                if (!SUBMISSION_FILE_EXTENSIONS.contains(extension))
                    throw new IllegalArgumentException("File bĂ i lĂ m chá»‰ há»— trá»£ PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP, RAR hoáº·c CSV");
                if (file.getSize() > MAX_SUBMISSION_FILE_SIZE)
                    throw new IllegalArgumentException("Má»—i file bĂ i lĂ m khĂ´ng Ä‘Æ°á»£c vÆ°á»£t quĂ¡ 10 MB");
                String type = contentType(extension);
                String path = storage.upload(
                        "homework/submissions/" + assignmentId + "/" + studentId + "/" + UUID.randomUUID(),
                        "answer-file." + extension, typed(file, type));
                uploaded.add(new UploadedFile(path, safeName(file.getOriginalFilename()), type, file.getSize()));
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
            throw new IllegalArgumentException("TĂªn tá»‡p khĂ´ng há»£p lá»‡ hoáº·c vÆ°á»£t quĂ¡ 255 kĂ½ tá»±");
        return name;
    }

    private static String contentType(String extension) {
        return switch (extension) {
            case "pdf" -> "application/pdf";
            case "doc" -> "application/msword";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "xls" -> "application/vnd.ms-excel";
            case "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case "ppt" -> "application/vnd.ms-powerpoint";
            case "pptx" -> "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            case "txt" -> "text/plain";
            case "csv" -> "text/csv";
            case "zip" -> "application/zip";
            case "rar" -> "application/vnd.rar";
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
            throw new IllegalArgumentException("Háº¡n ná»™p khĂ´ng há»£p lá»‡", error);
        }
    }

    private static BigDecimal parseScore(String value) {
        try {
            BigDecimal score = new BigDecimal(value);
            if (score.signum() < 0 || score.compareTo(BigDecimal.valueOf(MAX_SCORE)) > 0)
                throw new IllegalArgumentException("Äiá»ƒm tá»‘i Ä‘a pháº£i náº±m trong khoáº£ng 0 Ä‘áº¿n 1000");
            return score;
        } catch (NumberFormatException error) {
            throw new IllegalArgumentException("Äiá»ƒm tá»‘i Ä‘a khĂ´ng há»£p lá»‡", error);
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
    private void createNewHomeworkNotifications(long assignmentId, String title, Set<Long> studentIds) {
        List<Notification> notifications = new ArrayList<>();
        for (Long studentId : studentIds) {
            User student = users.findById(studentId).orElse(null);
            if (student == null || student.getRole() != UserRole.STUDENT || student.getStatus() != UserStatus.ACTIVE) continue;
            notifications.add(Notification.builder()
                    .user(student)
                    .type(NotificationType.HOMEWORK_NEW)
                    .title("Bài tập mới: " + title)
                    .message("Giáo viên vừa giao bài tập mới. Bấm để xem và bắt đầu làm bài.")
                    .referenceType("HOMEWORK")
                    .referenceId(assignmentId)
                    .build());
        }
        if (!notifications.isEmpty()) notificationRepository.saveAll(notifications);
    }

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
