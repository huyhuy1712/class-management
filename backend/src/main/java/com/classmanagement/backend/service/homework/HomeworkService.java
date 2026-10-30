package com.classmanagement.backend.service.homework;

import com.classmanagement.backend.dto.homework.HomeworkDtos;
import com.classmanagement.backend.entity.enums.MaterialAssignmentType;
import com.classmanagement.backend.service.homework.queries.HomeworkReadService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HomeworkService {
    private final HomeworkReadService reads;
    private final HomeworkWriteService writes;

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
        return writes.create(
                username, title, instructions, subjectId, gradeLevel, purpose, assignmentType,
                classIds, studentIds, dueAtValue, maxScoreValue, file, audioFile);
    }

    @Transactional(readOnly = true)
    public List<HomeworkDtos.Assignment> listForTeacher(String username, Long classId) {
        return reads.listForTeacher(username, classId);
    }

    @Transactional(readOnly = true)
    public HomeworkDtos.Assignment getForTeacher(long assignmentId, String username) {
        return reads.getForTeacher(assignmentId, username);
    }

    @Transactional(readOnly = true)
    public List<HomeworkDtos.Submission> submissions(long assignmentId, Long classId, String username) {
        return reads.submissions(assignmentId, classId, username);
    }

    @Transactional
    public HomeworkDtos.Assignment update(long assignmentId, String username, String title,
            String instructions, Long subjectId, String gradeLevel, String purpose,
            MaterialAssignmentType assignmentType, List<Long> classIds, List<Long> studentIds,
            String dueAtValue, String maxScoreValue, MultipartFile file, MultipartFile audioFile,
            boolean removeFile, boolean removeAudio) {
        return writes.update(
                assignmentId, username, title, instructions, subjectId, gradeLevel, purpose,
                assignmentType, classIds, studentIds, dueAtValue, maxScoreValue, file, audioFile,
                removeFile, removeAudio);
    }

    @Transactional
    public void delete(long assignmentId, String username) {
        writes.delete(assignmentId, username);
    }

    @Transactional
    public HomeworkDtos.Assignment updateDeadline(long assignmentId, LocalDateTime dueAt, String username) {
        return writes.updateDeadline(assignmentId, dueAt, username);
    }

    @Transactional
    public void reopen(long assignmentId, long studentId, String username) {
        writes.reopen(assignmentId, studentId, username);
    }

    @Transactional
    public HomeworkDtos.Submission grade(
            long assignmentId, long studentId, HomeworkDtos.GradeRequest request, String username) {
        return writes.grade(assignmentId, studentId, request, username);
    }

    @Transactional(readOnly = true)
    public List<HomeworkDtos.StudentAssignment> listForStudent(String username, Long classId) {
        return reads.listForStudent(username, classId);
    }

    @Transactional(readOnly = true)
    public HomeworkDtos.StudentAssignment getForStudent(long assignmentId, String username) {
        return reads.getForStudent(assignmentId, username);
    }

    @Transactional
    public HomeworkDtos.StudentAssignment submit(
            long assignmentId, String username, String answerText, List<MultipartFile> requestedImages,
            List<MultipartFile> requestedFiles, MultipartFile requestedAudio) {
        return writes.submit(assignmentId, username, answerText, requestedImages, requestedFiles, requestedAudio);
    }
}
