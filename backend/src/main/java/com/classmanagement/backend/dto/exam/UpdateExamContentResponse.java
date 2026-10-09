package com.classmanagement.backend.dto.exam;

import com.classmanagement.backend.entity.enums.ExamStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record UpdateExamContentResponse(Long id, String code, ExamStatus status, BigDecimal maxScore,
        Long revision, LocalDateTime updatedAt, IdMappings idMappings) {
    public record Mapping(String clientId, Long id) {}
    public record IdMappings(List<Mapping> sections, List<Mapping> questions, List<Mapping> answers,
            List<Mapping> options, List<Mapping> scoringRules) {}
}
