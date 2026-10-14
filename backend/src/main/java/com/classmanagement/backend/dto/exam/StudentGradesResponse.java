package com.classmanagement.backend.dto.exam;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record StudentGradesResponse(Filters filters,Summary summary,Charts charts,List<Item> items,int page,int size,long totalElements) {
    public record Option(Long id,String name) {}
    public record Filters(List<Option> classes,List<Option> subjects) {}
    public record Summary(BigDecimal average,BigDecimal highest,BigDecimal lowest,List<BigDecimal> modes,
            long gradedCount,long pendingGradingCount,long hiddenScoreCount,long passedCount,BigDecimal passRate) {}
    public record Point(Long attemptId,Long assignmentId,String title,int attemptNumber,OffsetDateTime submittedAt,BigDecimal score) {}
    public record Charts(List<Point> timeline,boolean timelineTruncated,List<Long> scoreBands,long gradedCount,long pendingGradingCount) {}
    public record Item(Long attemptId,Long assignmentId,String title,String code,Long subjectId,String subjectName,
            List<StudentExamResponse.ClassInfo> classes,int attemptNumber,String status,boolean scoreVisible,BigDecimal score,
            OffsetDateTime submittedAt,Integer durationSeconds,String teacherComment) {}
}
