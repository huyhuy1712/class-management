package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.exam.ExamListResponse;


import com.classmanagement.backend.dto.exam.CreateCompleteExamRequest;
import com.classmanagement.backend.dto.exam.CreateExamResponse;

import java.util.List;

public interface ExamService {

    CreateExamResponse createCompleteExam(String username, CreateCompleteExamRequest request);

    List<ExamListResponse> getMyExams(String username);

    List<com.classmanagement.backend.dto.exam.ClassExamResponse> getClassExams(String username, Long classId);

    void deleteExam(Long examId, String username, boolean force);

}
