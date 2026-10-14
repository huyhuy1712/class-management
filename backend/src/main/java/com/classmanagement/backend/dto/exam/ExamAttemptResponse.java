package com.classmanagement.backend.dto.exam;

import com.classmanagement.backend.entity.enums.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record ExamAttemptResponse(Long attemptId,Long assignmentId,int attemptNumber,Long revision,
        ExamAttemptStatus status,OffsetDateTime serverTime,OffsetDateTime deadline,int tabSwitchCount,
        ExamInfo exam,List<Section> sections,List<ExamAttemptPayload.Value> answers,Result result) {
    public record ExamInfo(Long id,String title,String code,BigDecimal maxScore,Integer timeLimit,Integer maxAttempts) {}
    public record Section(Long id,String title,String paragraph,ExamDetailResponse.Media imageMedia,
            ExamDetailResponse.Media audioMedia,List<Question> questions) {}
    public record Question(Long id,String content,String explanation,BigDecimal points,ExamDetailResponse.Media imageMedia,
            ExamDetailResponse.Media audioMedia,List<Group> answers,
            ExamDetailResponse.Media explanationImageMedia,ExamDetailResponse.Media explanationAudioMedia) {
        public Question(Long id,String content,String explanation,BigDecimal points,ExamDetailResponse.Media imageMedia,ExamDetailResponse.Media audioMedia,List<Group> answers) {
            this(id,content,explanation,points,imageMedia,audioMedia,answers,null,null);
        }
    }
    public record Group(Long id,AnswerType answerType,String content,BigDecimal points,
            ExamDetailResponse.Media imageMedia,ExamDetailResponse.Media audioMedia,List<Option> options) {}
    public record Option(Long id,String content,ExamDetailResponse.Media imageMedia,ExamDetailResponse.Media audioMedia) {}
    public record SectionScore(Long sectionId,BigDecimal autoScore,BigDecimal manualScore,BigDecimal totalScore) {}
    public record Review(Long answerId,String correctText,List<Long> correctOptionIds,
            List<ExamAttemptPayload.BooleanAnswer> correctBooleans,BigDecimal score,Boolean correct) {}
    public record Event(java.util.UUID eventId,ExamAttemptEventType type,OffsetDateTime receivedAt) {}
    public record Result(Long attemptId,int attemptNumber,Long revision,OffsetDateTime submittedAt,Integer durationSeconds,ExamAttemptStatus status,
            boolean scoreVisible,boolean answersVisible,boolean isFinal,BigDecimal autoScore,
            BigDecimal manualScore,BigDecimal totalScore,String teacherComment,List<SectionScore> sectionScores,
            List<Section> sections,List<ExamAttemptPayload.Value> answers,List<Review> review,
            int tabSwitchCount,List<Event> events) {}
    public record Summary(Long attemptId,Long studentId,String fullName,int attemptNumber,
            ExamAttemptStatus status,int tabSwitchCount,BigDecimal totalScore,String avatarUrl,String studentCode,String email,
            OffsetDateTime startedAt,OffsetDateTime submittedAt,Integer durationSeconds,String teacherComment,boolean isFinal,Long revision) {}
    public record Stats(long total,long notStarted,long inProgress,long submitted,long pendingGrading,long graded) {}
    public record Page(List<Summary> items,int page,int size,long totalElements,Stats stats) {}
}
