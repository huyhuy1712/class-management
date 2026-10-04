package com.classmanagement.backend.repository;

import com.classmanagement.backend.entity.Lesson;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LessonRepository
        extends JpaRepository<Lesson, Long> {

boolean existsByClassroom_IdAndLessonDate(
        Long classroomId,
        LocalDate lessonDate
);

boolean existsByClassroom_IdAndLessonDateAndIdNot(
        Long classroomId,
        LocalDate lessonDate,
        Long lessonId
);

List<Lesson> findAllByClassroom_IdAndLessonDateOrderByStartTimeAsc(
        Long classroomId,
        LocalDate lessonDate
);


}
