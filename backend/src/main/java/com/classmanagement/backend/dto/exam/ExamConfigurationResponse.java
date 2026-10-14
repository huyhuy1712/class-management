package com.classmanagement.backend.dto.exam;

import com.classmanagement.backend.entity.enums.ExamStatus;
import com.classmanagement.backend.entity.enums.ExamAssignmentStatus;
import com.classmanagement.backend.entity.enums.ExamAssignmentType;
import com.classmanagement.backend.entity.enums.ScoreVisibility;
import com.classmanagement.backend.entity.enums.AnswerVisibility;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ExamConfigurationResponse(
        Long id, String code, ExamStatus status, BigDecimal maxScore,
        LocalDateTime updatedAt, BasicInfo basicInfo, List<Assignment> assignments, Long revision,
        LocalDateTime createdAt, Creator creator) {
    public ExamConfigurationResponse(Long id,String code,ExamStatus status,BigDecimal maxScore,
            LocalDateTime updatedAt,BasicInfo basicInfo,List<Assignment> assignments,Long revision) {
        this(id,code,status,maxScore,updatedAt,basicInfo,assignments,revision,null,null);
    }
    public record Creator(Long id,String fullName,String avatarUrl) {}
    public record ClassroomInfo(Long id,String name,String code) {}

    public record BasicInfo(String title, Long subjectId, String subjectName,
            String gradeLevel, String purpose, String description,
            Integer timeLimit, Integer maxAttempts) {}

    public record Assignment(Long id, ExamAssignmentStatus status,
            ExamAssignmentType assignmentType, List<Long> classIds, List<Long> studentIds,
            Integer timeLimit, Integer maxAttempts, ScoreVisibility scoreVisibility,
            AnswerVisibility answerVisibility, BigDecimal threshold,
            Boolean hideCorrectAnswerOnWrong, LocalDateTime openTime,
            LocalDateTime closeTime, LocalDateTime updatedAt, List<StudentClassContext> studentClasses,
            List<ClassroomInfo> classrooms) {
        public Assignment(Long id,ExamAssignmentStatus status,ExamAssignmentType assignmentType,List<Long> classIds,List<Long> studentIds,
                Integer timeLimit,Integer maxAttempts,ScoreVisibility scoreVisibility,AnswerVisibility answerVisibility,BigDecimal threshold,
                Boolean hideCorrectAnswerOnWrong,LocalDateTime openTime,LocalDateTime closeTime,LocalDateTime updatedAt,List<StudentClassContext> studentClasses) {
            this(id,status,assignmentType,classIds,studentIds,timeLimit,maxAttempts,scoreVisibility,answerVisibility,threshold,
                    hideCorrectAnswerOnWrong,openTime,closeTime,updatedAt,studentClasses,List.of());
        }
    }

    public record StudentClassContext(Long studentId, Long classId) {}
}
