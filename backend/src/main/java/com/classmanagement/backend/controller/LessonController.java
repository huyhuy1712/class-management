package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.lesson.CreateLessonRequest;
import com.classmanagement.backend.dto.lesson.LessonResponse;
import com.classmanagement.backend.service.LessonService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;

    @PostMapping("/{classroomId}/lessons")
    public ResponseEntity<LessonResponse> createLesson(
            @PathVariable Long classroomId,
            @Valid @RequestBody CreateLessonRequest request,
            Authentication authentication) {
        LessonResponse response = lessonService.createLesson(
                classroomId,
                request,
                authentication.getName());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

@GetMapping("/{classroomId}/lessons")
public ResponseEntity<List<LessonResponse>> getLessonsByDate(
        @PathVariable Long classroomId,

        @RequestParam
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate date,

        Authentication authentication
) {
    return ResponseEntity.ok(
            lessonService.getLessonsByClassroomAndDate(
                    classroomId,
                    date,
                    authentication.getName()
            )
    );
}


@PutMapping("/{classroomId}/lessons/{lessonId}")
public ResponseEntity<LessonResponse> updateLesson(
                @PathVariable Long classroomId,
                @PathVariable Long lessonId,
                @Valid @RequestBody CreateLessonRequest request,
                Authentication authentication) {
        return ResponseEntity.ok(
                        lessonService.updateLesson(
                                        classroomId,
                                        lessonId,
                                        request,
                                        authentication.getName()));
}

}