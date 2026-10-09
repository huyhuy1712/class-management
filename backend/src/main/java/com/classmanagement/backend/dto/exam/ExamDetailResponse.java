package com.classmanagement.backend.dto.exam;

import com.classmanagement.backend.entity.enums.AnswerType;
import com.classmanagement.backend.entity.enums.ExamStatus;
import com.classmanagement.backend.entity.enums.ScoringType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ExamDetailResponse(Long id, String code, ExamStatus status, BigDecimal maxScore,
        LocalDateTime updatedAt, ExamConfigurationResponse.BasicInfo basicInfo,
        List<ExamConfigurationResponse.Assignment> assignments, List<Section> sections, Long revision) {

    public record Media(UUID mediaId, String url) {}

    public record Section(Long id, Integer orderIndex, String title, String paragraph,
            BigDecimal points, Media imageMedia, Media audioMedia, List<Question> questions) {}

    public record Question(Long id, Integer orderIndex, String content, BigDecimal points,
            Media imageMedia, Media audioMedia, List<Answer> answers) {}

    public record Answer(Long id, Integer orderIndex, AnswerType answerType, String content,
            BigDecimal points, ScoringType scoringType, String correctAnswerText,
            Boolean correctBoolean, Boolean caseSensitive, Media imageMedia, Media audioMedia,
            List<Option> options, List<ScoringRule> scoringRules) {}

    public record Option(Long id, Integer orderIndex, String content, Boolean isCorrect,
            BigDecimal points, Media imageMedia, Media audioMedia) {}

    public record ScoringRule(Long id, Integer correctCount, BigDecimal score) {}
}
