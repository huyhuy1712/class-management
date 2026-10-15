package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.subject.SubjectResponse;
import com.classmanagement.backend.dto.subject.SubjectRequest;

import java.util.List;

public interface SubjectService {

    List<SubjectResponse> getAllSubjects();

    SubjectResponse createSubject(SubjectRequest request);

    SubjectResponse updateSubject(Long subjectId, SubjectRequest request);

    void deleteSubject(Long subjectId);
}