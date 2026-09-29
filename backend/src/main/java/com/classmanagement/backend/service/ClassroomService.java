package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.classroom.AddStudentToClassroomRequest;
import com.classmanagement.backend.dto.classroom.ClassroomResponse;
import com.classmanagement.backend.dto.classroom.ClassroomStudentResponse;
import com.classmanagement.backend.dto.classroom.CreateClassroomRequest;
import com.classmanagement.backend.dto.classroom.UpdateClassroomRequest;


import java.util.List;

public interface ClassroomService {

    ClassroomResponse createClassroom(CreateClassroomRequest request);

    List<ClassroomResponse> getAllClassrooms();

    ClassroomResponse updateClass(Long id, UpdateClassroomRequest request);
    

    ClassroomResponse archiveClassroom(Long id);
    void deleteClassroom(Long id);

    ClassroomStudentResponse addStudent(
        Long classroomId,
        AddStudentToClassroomRequest request);

    List<ClassroomStudentResponse> getStudentsByClassroomId(
        Long classroomId);

}