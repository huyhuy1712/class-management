package com.classmanagement.backend.service.homework;

import com.classmanagement.backend.dto.homework.HomeworkDtos;
import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.enums.MaterialAssignmentType;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.service.homework.files.HomeworkFileService;
import com.classmanagement.backend.service.homework.notifications.HomeworkNotificationService;
import com.classmanagement.backend.service.homework.queries.HomeworkReadService;
import com.classmanagement.backend.service.homework.recipients.HomeworkRecipientResolver;
import com.classmanagement.backend.service.impl.material.MaterialAssignmentManager;
import com.classmanagement.backend.service.impl.material.MaterialDistribution;
import com.classmanagement.backend.service.impl.material.MaterialFileSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import static com.classmanagement.backend.service.homework.HomeworkSupport.*;

@Service
@RequiredArgsConstructor
public class HomeworkWriteService {
    private final JdbcTemplate jdbc;
    private final MaterialAssignmentManager assignmentManager;
    private final MaterialFileSupport materialFileSupport;
    private final HomeworkReadService reads;
    private final HomeworkFileService homeworkFiles;
    private final HomeworkRecipientResolver recipientResolver;
    private final HomeworkNotificationService notifications;

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
        User teacher = reads.requireUser(username, UserRole.TEACHER);
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
        HomeworkRecipientResolver.RecipientSnapshot recipients =
                recipientResolver.resolve(teacher.getId(), assignmentType, distribution);

        HomeworkFileService.UploadedFile uploaded = null;
        HomeworkFileService.UploadedFile uploadedAudio = null;
        try {
            uploaded = file == null || file.isEmpty() ? null : homeworkFiles.uploadPrompt(teacher.getId(), file);
            uploadedAudio = audioFile == null || audioFile.isEmpty() ? null : homeworkFiles.uploadAudio(
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
            notifications.notifyNewAssignment(assignmentId, normalizedTitle, recipients.students().keySet());
            return reads.teacherAssignment(assignmentId, teacher.getId());
        } catch (RuntimeException error) {
            homeworkFiles.deleteUploaded(uploaded, error);
            homeworkFiles.deleteUploaded(uploadedAudio, error);
            throw error;
        }
    }

    public HomeworkDtos.Assignment update(long assignmentId, String username, String title,
            String instructions, Long subjectId, String gradeLevel, String purpose,
            MaterialAssignmentType assignmentType, List<Long> classIds, List<Long> studentIds,
            String dueAtValue, String maxScoreValue, MultipartFile file, MultipartFile audioFile,
            boolean removeFile, boolean removeAudio) {
        User teacher = reads.requireUser(username, UserRole.TEACHER);
        reads.requireOwnedAssignment(assignmentId, teacher.getId());

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
        HomeworkRecipientResolver.RecipientSnapshot recipients =
                recipientResolver.resolve(teacher.getId(), assignmentType, distribution);

        HomeworkFileService.UploadedFile uploaded = null;
        HomeworkFileService.UploadedFile uploadedAudio = null;
        try {
            uploaded = file == null || file.isEmpty() ? null : homeworkFiles.uploadPrompt(teacher.getId(), file);
            uploadedAudio = audioFile == null || audioFile.isEmpty() ? null : homeworkFiles.uploadAudio(
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
                homeworkFiles.delete(oldAttachmentPath);
            if ((uploadedAudio != null || removeAudio) && oldAudioPath != null)
                homeworkFiles.delete(oldAudioPath);
            return reads.teacherAssignment(assignmentId, teacher.getId());
        } catch (RuntimeException error) {
            homeworkFiles.deleteUploaded(uploaded, error);
            homeworkFiles.deleteUploaded(uploadedAudio, error);
            throw error;
        }
    }

    public void delete(long assignmentId, String username) {
        User teacher = reads.requireUser(username, UserRole.TEACHER);
        reads.requireOwnedAssignment(assignmentId, teacher.getId());
        List<String> filePaths = jdbc.query("""
                SELECT attachment_path AS object_path FROM homework_assignments
                WHERE id = ? AND attachment_path IS NOT NULL
                UNION ALL
                SELECT audio_path FROM homework_assignments
                WHERE id = ? AND audio_path IS NOT NULL
                UNION ALL
                SELECT image.object_path FROM homework_submission_images image
                JOIN homework_submissions submission ON submission.id = image.submission_id
                WHERE submission.assignment_id = ?
                UNION ALL
                SELECT file.object_path FROM homework_submission_files file
                JOIN homework_submissions submission ON submission.id = file.submission_id
                WHERE submission.assignment_id = ?
                UNION ALL
                SELECT audio.object_path FROM homework_submission_audio audio
                JOIN homework_submissions submission ON submission.id = audio.submission_id
                WHERE submission.assignment_id = ?
                """, (rs, rowNum) -> rs.getString("object_path"),
                assignmentId, assignmentId, assignmentId, assignmentId, assignmentId);
        jdbc.update("""
                DELETE FROM notifications
                WHERE type = 'HOMEWORK_NEW' AND reference_type = 'HOMEWORK' AND reference_id = ?
                """, assignmentId);
        jdbc.update("DELETE FROM homework_assignments WHERE id = ?", assignmentId);
        filePaths.forEach(materialFileSupport::scheduleDelete);
    }

    public HomeworkDtos.Assignment updateDeadline(long assignmentId, LocalDateTime dueAt, String username) {
        User teacher = reads.requireUser(username, UserRole.TEACHER);
        reads.requireOwnedAssignment(assignmentId, teacher.getId());
        if (dueAt != null && !dueAt.isAfter(now()))
            throw new IllegalArgumentException("Háº¡n ná»™p má»›i pháº£i á»Ÿ tÆ°Æ¡ng lai");
        jdbc.update("""
                UPDATE homework_assignments
                SET due_at = ?, status = 'OPEN', updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """, dueAt, assignmentId);
        return reads.teacherAssignment(assignmentId, teacher.getId());
    }

    public void reopen(long assignmentId, long studentId, String username) {
        User teacher = reads.requireUser(username, UserRole.TEACHER);
        reads.requireOwnedAssignment(assignmentId, teacher.getId());
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

    public HomeworkDtos.Submission grade(
            long assignmentId, long studentId, HomeworkDtos.GradeRequest request, String username) {
        User teacher = reads.requireUser(username, UserRole.TEACHER);
        HomeworkDtos.Assignment assignment = reads.teacherAssignment(assignmentId, teacher.getId());
        if (request == null || request.score() == null || request.score().signum() < 0
                || request.score().compareTo(assignment.maxScore()) > 0)
            throw new IllegalArgumentException("Điểm phải nằm trong khoảng 0 đến " + assignment.maxScore());
        if (request.teacherComment() != null && request.teacherComment().length() > 10000)
            throw new IllegalArgumentException("Nháº­n xĂ©t tá»‘i Ä‘a 10.000 kĂ½ tá»±");
        int updated = jdbc.update("""
                UPDATE homework_submissions
                SET status = 'GRADED', score = ?, teacher_comment = ?, graded_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE assignment_id = ? AND student_id = ? AND status = 'SUBMITTED'
                """, request.score(), normalize(request.teacherComment()), assignmentId, studentId);
        if (updated == 0)
            throw new IllegalArgumentException("Bài nộp này đã được chấm. Nếu cần chấm lại, hãy mở lại bài để học sinh nộp lại trước.");
        return reads.submissions(assignmentId, null, username).stream()
                .filter(row -> row.studentId() == studentId)
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("KhĂ´ng tĂ¬m tháº¥y bĂ i ná»™p"));
    }

    public HomeworkDtos.StudentAssignment submit(
            long assignmentId, String username, String answerText, List<MultipartFile> requestedImages,
            List<MultipartFile> requestedFiles, MultipartFile requestedAudio) {
        User student = reads.requireUser(username, UserRole.STUDENT);
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
        if (images.size() > HomeworkFileService.MAX_IMAGES)
            throw new IllegalArgumentException("Má»—i láº§n ná»™p tá»‘i Ä‘a " + HomeworkFileService.MAX_IMAGES + " áº£nh");
        if (files.size() > HomeworkFileService.MAX_SUBMISSION_FILES)
            throw new IllegalArgumentException("Má»—i láº§n ná»™p tá»‘i Ä‘a " + HomeworkFileService.MAX_SUBMISSION_FILES + " tá»‡p");

        boolean reopened = "REOPENED".equals(gate.submissionStatus());
        if (!"OPEN".equals(gate.assignmentStatus()) && !reopened)
            throw new IllegalArgumentException("BĂ i táº­p Ä‘Ă£ Ä‘Ă³ng, khĂ´ng thá»ƒ ná»™p bĂ i");
        if (gate.dueAt() != null && !gate.dueAt().isAfter(now()) && !reopened)
            throw new IllegalArgumentException("ÄĂ£ quĂ¡ háº¡n ná»™p bĂ i");
        if ("GRADED".equals(gate.submissionStatus()))
            throw new IllegalArgumentException("BĂ i Ä‘Ă£ Ä‘Æ°á»£c cháº¥m; cáº§n giĂ¡o viĂªn má»Ÿ láº¡i trÆ°á»›c khi ná»™p láº¡i");

        List<HomeworkFileService.UploadedFile> uploaded = homeworkFiles.uploadImages(assignmentId, student.getId(), images);
        List<HomeworkFileService.UploadedFile> uploadedFiles = homeworkFiles.uploadSubmissionFiles(assignmentId, student.getId(), files);
        HomeworkFileService.UploadedFile uploadedAudio = null;
        try {
            if (hasAudio) {
                uploadedAudio = homeworkFiles.uploadAudio(
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
                    HomeworkFileService.UploadedFile image = uploaded.get(index);
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
                    HomeworkFileService.UploadedFile file = uploadedFiles.get(index);
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
            return reads.getForStudent(assignmentId, username);
        } catch (RuntimeException error) {
            uploaded.forEach(item -> homeworkFiles.deleteUploaded(item, error));
            uploadedFiles.forEach(item -> homeworkFiles.deleteUploaded(item, error));
            homeworkFiles.deleteUploaded(uploadedAudio, error);
            throw error;
        }
    }
    private record AssignmentGate(String assignmentStatus, LocalDateTime dueAt, Long submissionId, String submissionStatus) {}
}
