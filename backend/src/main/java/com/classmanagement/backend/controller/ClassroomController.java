package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.classroom.AddStudentToClassroomRequest;
import com.classmanagement.backend.dto.classroom.ClassroomResponse;
import com.classmanagement.backend.dto.classroom.ClassroomStudentResponse;
import com.classmanagement.backend.dto.classroom.CreateClassroomRequest;
import com.classmanagement.backend.dto.classroom.ImportStudentsResponse;
import com.classmanagement.backend.dto.classroom.UpdateClassroomRequest;
import com.classmanagement.backend.service.ClassroomService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.core.Authentication;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

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

@PatchMapping("/{id}/activate")
public ResponseEntity<ClassroomResponse> activateClassroom(
                        @PathVariable Long id) {

                ClassroomResponse response = classroomService.activateClassroom(id);

                return ResponseEntity.ok(response);
        }

@DeleteMapping("/{id}")
public ResponseEntity<Void> deleteClassroom(
                        @PathVariable Long id) {

                classroomService.deleteClassroom(id);

                return ResponseEntity.noContent().build();
        }

@PostMapping("/{classroomId}/students")
public ResponseEntity<ClassroomStudentResponse> addStudent(
        @PathVariable Long classroomId,
        @Valid @RequestBody AddStudentToClassroomRequest request
) {

    ClassroomStudentResponse response =
            classroomService.addStudent(
                    classroomId,
                    request
            );

    return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(response);
}

@GetMapping("/{classroomId}/students")
public ResponseEntity<List<ClassroomStudentResponse>> getStudentsByClassroomId(
                        @PathVariable Long classroomId) {

                return ResponseEntity.ok(
                                classroomService.getStudentsByClassroomId(classroomId));
        }

@DeleteMapping("/{classroomId}/students/{studentId}")
public ResponseEntity<Void> removeStudentFromClassroom(
                @PathVariable Long classroomId,
                @PathVariable Long studentId) {

        classroomService.removeStudentFromClassroom(
                        classroomId,
                        studentId);

        return ResponseEntity.noContent().build();
}

@DeleteMapping("/{classroomId}/students")
public ResponseEntity<Void> removeAllStudentsFromClassroom(
                @PathVariable Long classroomId) {

        classroomService.removeAllStudentsFromClassroom(classroomId);

        return ResponseEntity.noContent().build();
}

@GetMapping("/my")
public ResponseEntity<List<ClassroomResponse>> getMyClassrooms(
                Authentication authentication) {
        return ResponseEntity.ok(
                        classroomService.getMyClassrooms(
                                        authentication.getName()));
}

@GetMapping("/students/import-template")
public ResponseEntity<byte[]> downloadStudentImportTemplate() throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
                        ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                Sheet sheet = workbook.createSheet("Danh sách học sinh");
                Row header = sheet.createRow(0);
                header.createCell(0).setCellValue("Mã học sinh");
                sheet.setColumnWidth(0, 20 * 256);
                workbook.write(output);

                return ResponseEntity.ok()
                                .contentType(MediaType.parseMediaType(
                                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                                .header(HttpHeaders.CONTENT_DISPOSITION,
                                                ContentDisposition.attachment()
                                                                .filename("mau-import-hoc-sinh.xlsx")
                                                                .build()
                                                                .toString())
                                .body(output.toByteArray());
        }
}

@PostMapping(
        value = "/{classroomId}/students/import",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
)
public ResponseEntity<ImportStudentsResponse> importStudents(
        @PathVariable Long classroomId,
        @RequestParam("file") MultipartFile file
) {
    return ResponseEntity.ok(
            classroomService.importStudents(classroomId, file)
    );
}
}