package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.subject.SubjectResponse;

import java.util.List;

public interface SubjectService {

    List<SubjectResponse> getAllSubjects();
}