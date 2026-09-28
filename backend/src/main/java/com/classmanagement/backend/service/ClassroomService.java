package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.classroom.ClassroomResponse;
import com.classmanagement.backend.dto.classroom.CreateClassroomRequest;

import java.util.List;

public interface ClassroomService {

    ClassroomResponse createClassroom(CreateClassroomRequest request);

    List<ClassroomResponse> getAllClassrooms();
}