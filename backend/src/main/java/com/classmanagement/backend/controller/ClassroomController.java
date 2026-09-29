package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.classroom.ClassroomResponse;
import com.classmanagement.backend.dto.classroom.CreateClassroomRequest;
import com.classmanagement.backend.dto.classroom.UpdateClassroomRequest;
import com.classmanagement.backend.service.ClassroomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClassroomController {

        private final ClassroomService classroomService;

        @PostMapping
        public ResponseEntity<ClassroomResponse> createClassroom(
                        @Valid @RequestBody CreateClassroomRequest request) {

                ClassroomResponse response = classroomService.createClassroom(request);

                return ResponseEntity
                                .status(HttpStatus.CREATED)
                                .body(response);
        }

        @GetMapping
        public ResponseEntity<List<ClassroomResponse>> getAllClassrooms() {

                return ResponseEntity.ok(
                                classroomService.getAllClassrooms());
        }

        @PutMapping("/{id}")
        public ResponseEntity<ClassroomResponse> updateClass(
                        @PathVariable Long id,
                        @Valid @RequestBody UpdateClassroomRequest request) {

                ClassroomResponse response = classroomService.updateClass(id, request);

                return ResponseEntity.ok(response);
        }

        @PatchMapping("/{id}/archive")
        public ResponseEntity<ClassroomResponse> archiveClassroom(
                        @PathVariable Long id) {

                ClassroomResponse response = classroomService.archiveClassroom(id);

                return ResponseEntity.ok(response);
        }

        @DeleteMapping("/{id}")
        public ResponseEntity<Void> deleteClassroom(
                        @PathVariable Long id) {

                classroomService.deleteClassroom(id);

                return ResponseEntity.noContent().build();
        }

}