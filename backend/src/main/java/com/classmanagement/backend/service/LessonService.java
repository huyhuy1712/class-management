package com.classmanagement.backend.service;

import java.time.LocalDate;
import java.util.List;

import com.classmanagement.backend.dto.lesson.CreateLessonRequest;
import com.classmanagement.backend.dto.lesson.LessonResponse;

public interface LessonService {

    LessonResponse createLesson(
            Long classroomId,
            CreateLessonRequest request,
            String username);

    List<LessonResponse> getLessonsByClassroomAndDate(
        Long classroomId,
        LocalDate date,
        String username
);

LessonResponse updateLesson(
                Long classroomId,
                Long lessonId,
                CreateLessonRequest request,
                String username);

                
}