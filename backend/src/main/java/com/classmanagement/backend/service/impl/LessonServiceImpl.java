package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.lesson.CreateLessonRequest;
import com.classmanagement.backend.dto.lesson.LessonResponse;
import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.entity.Lesson;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import com.classmanagement.backend.exception.ConflictException;
import com.classmanagement.backend.repository.LessonRepository;
import com.classmanagement.backend.repository.classroom.ClassroomRepository;
import com.classmanagement.backend.service.LessonService;

import lombok.RequiredArgsConstructor;

import java.time.LocalDate;
import java.util.List;

import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LessonServiceImpl implements LessonService {

    private final LessonRepository lessonRepository;
    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;
    private final ClassStudentRepository classStudentRepository;

@Override
@Transactional
public LessonResponse createLesson(
            Long classroomId,
            CreateLessonRequest request,
            String username) {
        Classroom classroom = getClassroom(classroomId);

        validateTeacherOwnership(
                classroom,
                username);

        validateLessonTime(request);
        validateLessonDateAvailable(classroomId, request.getLessonDate());

        Lesson lesson = buildLesson(
                classroom,
                request);

        Lesson savedLesson = saveLesson(lesson);

        return toResponse(savedLesson);
    }

private Classroom getClassroom(
            Long classroomId) {
        return classroomRepository
                .findById(classroomId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy lớp học"));
    }

@Override
@Transactional(readOnly = true)
public List<LessonResponse> getLessonsByClassroomAndDate(
            Long classroomId,
            LocalDate date,
            String username) {
        Classroom classroom = getClassroom(classroomId);

        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        boolean includeAttendanceCode = user.getRole() == UserRole.TEACHER;
        if (includeAttendanceCode) {
                validateTeacherOwnership(classroom, username);
        } else if (user.getRole() != UserRole.STUDENT
                || !classStudentRepository.existsByClassroom_IdAndStudent_Username(classroomId, username)) {
                throw new IllegalStateException("Bạn không có quyền xem buổi học của lớp này");
        }

        return lessonRepository
                .findAllByClassroom_IdAndLessonDateOrderByStartTimeAsc(
                        classroomId,
                        date)
                .stream()
                .map(lesson -> toResponse(lesson, includeAttendanceCode))
                .toList();
} 
  
@Override
@Transactional
public LessonResponse updateLesson(
                Long classroomId,
                Long lessonId,
                CreateLessonRequest request,
                String username) {
        Classroom classroom = getClassroom(classroomId);

        validateTeacherOwnership(
                        classroom,
                        username);

        Lesson lesson = getLesson(
                        lessonId,
                        classroomId);

        validateLessonTime(request);
        validateLessonDateAvailable(
                        classroomId,
                        request.getLessonDate(),
                        lessonId);

        updateLessonFields(
                        lesson,
                        request);

        Lesson savedLesson = saveLesson(lesson);

        return toResponse(savedLesson);
}


// Helpers
private void validateLessonDateAvailable(
        Long classroomId,
        LocalDate lessonDate) {
        if (lessonRepository.existsByClassroom_IdAndLessonDate(
                classroomId,
                lessonDate)) {
            throw new ConflictException(
                    "Lớp học đã có buổi học vào ngày này");
        }
}

private void validateLessonDateAvailable(
        Long classroomId,
        LocalDate lessonDate,
        Long lessonId) {
        if (lessonRepository.existsByClassroom_IdAndLessonDateAndIdNot(
                classroomId,
                lessonDate,
                lessonId)) {
            throw new ConflictException(
                    "Lớp học đã có buổi học vào ngày này");
        }
}

private Lesson saveLesson(Lesson lesson) {
        try {
                return lessonRepository.saveAndFlush(lesson);
        } catch (DataIntegrityViolationException exception) {
                if (isLessonDateUniqueViolation(exception)) {
                        throw new ConflictException(
                                "Lớp học đã có buổi học vào ngày này");
                }
                throw exception;
        }
}

private boolean isLessonDateUniqueViolation(Throwable exception) {
        Throwable cause = exception;
        while (cause != null) {
                if (cause instanceof ConstraintViolationException violation
                        && "uq_lessons_class_date".equals(
                                violation.getConstraintName())) {
                        return true;
                }
                cause = cause.getCause();
        }
        return false;
}

private void validateTeacherOwnership(
            Classroom classroom,
            String username) {
        if (classroom.getTeacher() == null
                || !classroom.getTeacher()
                        .getUsername()
                        .equals(username)) {

            throw new IllegalStateException(
                    "Bạn không có quyền tạo buổi học cho lớp này");
        }
    }

private void validateLessonTime(
            CreateLessonRequest request) {
        if (request.getStartTime()
                .isAfter(request.getLateTime())) {

            throw new IllegalArgumentException(
                    "Thời gian bắt đầu phải trước hoặc bằng thời gian tính đi trễ");
        }

        if (request.getLateTime()
                .isAfter(request.getEndTime())) {

            throw new IllegalArgumentException(
                    "Thời gian tính đi trễ phải trước hoặc bằng thời gian kết thúc");
        }

        validateLessonDate(request);
    }

private void validateLessonDate(
            CreateLessonRequest request) {
        if (!request.getStartTime()
                .toLocalDate()
                .equals(request.getLessonDate())
                || !request.getLateTime()
                        .toLocalDate()
                        .equals(request.getLessonDate())
                || !request.getEndTime()
                        .toLocalDate()
                        .equals(request.getLessonDate())) {

            throw new IllegalArgumentException(
                    "Ngày của các mốc thời gian phải trùng với ngày học");
        }
    }

private Lesson buildLesson(
            Classroom classroom,
            CreateLessonRequest request) {
        return Lesson.builder()
                .classroom(classroom)
                .title(request.getTitle().trim())
                .lessonDate(request.getLessonDate())
                .attendanceCode(
                        request.getAttendanceCode().trim())
                .startTime(request.getStartTime())
                .lateTime(request.getLateTime())
                .endTime(request.getEndTime())
                .build();
    }

private LessonResponse toResponse(
            Lesson lesson) {
        return toResponse(lesson, true);
    }

private LessonResponse toResponse(Lesson lesson, boolean includeAttendanceCode) {
        return LessonResponse.builder()
                .id(lesson.getId())
                .classroomId(
                        lesson.getClassroom().getId())
                .classroomName(
                        lesson.getClassroom().getName())
                .title(lesson.getTitle())
                .lessonDate(lesson.getLessonDate())
                .attendanceCode(
                        includeAttendanceCode ? lesson.getAttendanceCode() : null)
                .startTime(lesson.getStartTime())
                .lateTime(lesson.getLateTime())
                .endTime(lesson.getEndTime())
                .createdAt(lesson.getCreatedAt())
                .build();
    }

private Lesson getLesson(
        Long lessonId,
        Long classroomId) {
Lesson lesson = lessonRepository
                .findById(lessonId)
                .orElseThrow(() -> new IllegalArgumentException(
                                "Không tìm thấy buổi học"));

if (!lesson.getClassroom()
                .getId()
                .equals(classroomId)) {

        throw new IllegalArgumentException(
                        "Buổi học không thuộc lớp học này");
}

return lesson;
}

private void updateLessonFields(
        Lesson lesson,
        CreateLessonRequest request) {
        lesson.setTitle(request.getTitle().trim());
        lesson.setLessonDate(request.getLessonDate());
        lesson.setAttendanceCode(request.getAttendanceCode().trim());
        lesson.setStartTime(request.getStartTime());
        lesson.setLateTime(request.getLateTime());
        lesson.setEndTime(request.getEndTime());
}

}
