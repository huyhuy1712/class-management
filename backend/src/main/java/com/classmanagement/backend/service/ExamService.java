package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.exam.ExamListResponse;
import com.classmanagement.backend.dto.exam.ExamUpdateResponse;
import com.classmanagement.backend.dto.exam.UpdateExamRequest;

import java.util.List;

public interface ExamService {

    List<ExamListResponse> getMyExams(String username);

    void deleteExam(Long examId, String username, boolean force);

    ExamUpdateResponse updateExam(
        Long examId,
        String username,
        UpdateExamRequest request
);


}