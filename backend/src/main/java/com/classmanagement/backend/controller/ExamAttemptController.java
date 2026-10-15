package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.exam.*;
import com.classmanagement.backend.service.exam.ExamAttemptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/exam-attempts")
@RequiredArgsConstructor
public class ExamAttemptController {
    private final ExamAttemptService attempts;
    @GetMapping("/{attemptId}/teacher-review")
    public ExamAttemptResponse.TeacherReview teacherReview(@PathVariable Long attemptId,Authentication auth) {
        return attempts.teacherReview(attemptId,auth.getName());
    }
    @PostMapping("/{attemptId}/reset")
    public void reset(@PathVariable Long attemptId,@Valid @RequestBody ExamAttemptPayload.Reset body,Authentication auth) {
        attempts.resetByTeacher(attemptId,auth.getName(),body);
    }
    @GetMapping("/{attemptId}")
    public ExamAttemptResponse get(@PathVariable Long attemptId,Authentication auth) {
        return attempts.get(attemptId,auth.getName());
    }
    @PutMapping("/{attemptId}/answers")
    public ExamAttemptResponse save(@PathVariable Long attemptId,@Valid @RequestBody ExamAttemptPayload.Save body,Authentication auth) {
        return attempts.save(attemptId,auth.getName(),body);
    }
    @PostMapping("/{attemptId}/submit")
    public ExamAttemptResponse.Result submit(@PathVariable Long attemptId,@Valid @RequestBody ExamAttemptPayload.Save body,Authentication auth) {
        return attempts.submit(attemptId,auth.getName(),body);
    }
    @GetMapping("/{attemptId}/result")
    public ExamAttemptResponse.Result result(@PathVariable Long attemptId,Authentication auth) {
        return attempts.result(attemptId,auth.getName());
    }
    @PatchMapping("/{attemptId}/grades")
    public ExamAttemptResponse.Result grade(@PathVariable Long attemptId,@Valid @RequestBody ExamAttemptPayload.Grades body,Authentication auth) {
        return attempts.grade(attemptId,auth.getName(),body);
    }
}
