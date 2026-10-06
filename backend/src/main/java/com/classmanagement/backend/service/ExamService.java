package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.exam.ExamListResponse;

import java.util.List;

public interface ExamService {

    List<ExamListResponse> getMyExams(String username);
}