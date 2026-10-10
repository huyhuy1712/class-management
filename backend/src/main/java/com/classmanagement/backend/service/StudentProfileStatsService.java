package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.user.StudentExamCountResponse;
import com.classmanagement.backend.entity.enums.ExamAttemptStatus;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.exam.ExamAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentProfileStatsService {
    private final UserRepository users;
    private final ExamAttemptRepository attempts;

    @Transactional(readOnly = true)
    public StudentExamCountResponse getExamCount(String username) {
        var user = users.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng."));
        if (user.getRole() != UserRole.STUDENT) throw new IllegalStateException("Chỉ học sinh được xem thống kê này.");
        return new StudentExamCountResponse(attempts.countCompletedExams(user.getId(),
                List.of(ExamAttemptStatus.SUBMITTED, ExamAttemptStatus.GRADED)));
    }
}
