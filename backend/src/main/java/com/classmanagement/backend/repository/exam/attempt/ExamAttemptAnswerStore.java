package com.classmanagement.backend.repository.exam.attempt;

import com.classmanagement.backend.dto.exam.ExamAttemptPayload;
import com.classmanagement.backend.dto.exam.ExamDetailResponse;
import com.classmanagement.backend.entity.enums.GradingStatus;
import com.classmanagement.backend.service.exam.attempt.ExamScoringCalculator;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;

/** Batch answer persistence and grading scores. */
@RequiredArgsConstructor
public class ExamAttemptAnswerStore {

    private final NamedParameterJdbcTemplate jdbc;

    public Map<Long, Map<Long, ExamAttemptPayload.Value>> readAnswers(Collection<Long> ids) {
        if (ids.isEmpty())
            return Map.of();
        record Key(Long attemptId, Long answerId) {
        }
        class Builder {
            String text;
            List<Long> options = new ArrayList<>();
            List<ExamAttemptPayload.BooleanAnswer> bools = new ArrayList<>();
        }
        Map<Key, Builder> builders = new LinkedHashMap<>();
        jdbc.query(
                "select sa.attempt_id,v.answer_id,v.answer_text,o.option_id,o.boolean_value from student_answers sa join student_answer_values v on v.student_answer_id=sa.id left join student_answer_options o on o.answer_value_id=v.id where sa.attempt_id in (:ids) order by sa.attempt_id,v.answer_id,o.option_id",
                p("ids", ids), (org.springframework.jdbc.core.RowCallbackHandler) r -> {
                    var b = builders.computeIfAbsent(new Key(r.getLong(1), r.getLong(2)), k -> new Builder());
                    b.text = r.getString(3);
                    Long option = r.getObject(4, Long.class);
                    Boolean bool = r.getObject(5, Boolean.class);
                    if (option != null) {
                        if (bool == null)
                            b.options.add(option);
                        else
                            b.bools.add(new ExamAttemptPayload.BooleanAnswer(option, bool));
                    }
                });
        Map<Long, Map<Long, ExamAttemptPayload.Value>> result = new HashMap<>();
        builders.forEach((k, b) -> result.computeIfAbsent(k.attemptId(), x -> new LinkedHashMap<>()).put(k.answerId(),
                new ExamAttemptPayload.Value(k.answerId(), b.text, b.options, b.bools)));
        return result;
    }

    public Map<Long, BigDecimal> manualScores(Long id) {
        Map<Long, BigDecimal> scores = new HashMap<>();
        jdbc.query(
                "select v.answer_id,v.score from student_answer_values v join student_answers s on s.id=v.student_answer_id join answers a on a.id=v.answer_id where s.attempt_id=:id and a.answer_type='ESSAY' and v.score is not null",
                p("id", id),
                (org.springframework.jdbc.core.RowCallbackHandler) r -> scores.put(r.getLong(1), r.getBigDecimal(2)));
        return scores;
    }

    public void write(Long id, Long examId, List<ExamDetailResponse.Section> structure,
            Map<Long, ExamAttemptPayload.Value> values, ExamScoringCalculator.Scores scores, LocalDateTime now,
            Long teacherId) {
        jdbc.update(
                "insert into student_answers(attempt_id,question_id,created_at,updated_at) select :id,q.id,:now,:now from questions q join exam_sections s on s.id=q.section_id where s.exam_id=:examId on conflict (attempt_id,question_id) do nothing",
                p("id", id, "examId", examId, "now", now));
        Map<Long, Long> questions = new HashMap<>();
        jdbc.query("select question_id,id from student_answers where attempt_id=:id", p("id", id),
                (org.springframework.jdbc.core.RowCallbackHandler) r -> questions.put(r.getLong(1), r.getLong(2)));
        Map<Long, Long> parents = new HashMap<>();
        for (var s : structure)
            for (var q : s.questions())
                for (var a : q.answers())
                    parents.put(a.id(), questions.get(q.id()));
        Map<Long, ExamScoringCalculator.GroupScore> grading = new HashMap<>();
        if (scores != null)
            scores.groups().forEach(g -> grading.put(g.answerId(), g));
        Set<Long> retained = scores == null ? values.keySet() : parents.keySet();
        String delete = "delete from student_answer_values where student_answer_id in (select id from student_answers where attempt_id=:id)";
        jdbc.update(delete + (retained.isEmpty() ? "" : " and answer_id not in (:ids)"), p("id", id, "ids", retained));
        List<MapSqlParameterSource> rows = new ArrayList<>();
        for (Long answerId : retained) {
            var value = values.get(answerId);
            var grade = grading.get(answerId);
            rows.add(p("parent", parents.get(answerId), "answer", answerId, "text", value == null ? null : value.text(),
                    "score", grade == null ? null : grade.score(), "correct", grade == null ? null : grade.correct(),
                    "now", now));
        }
        batch("insert into student_answer_values(student_answer_id,answer_id,answer_text,score,is_correct,created_at,updated_at) values (:parent,:answer,:text,:score,:correct,:now,:now) on conflict (student_answer_id,answer_id) do update set answer_text=excluded.answer_text,score=excluded.score,is_correct=excluded.is_correct,updated_at=excluded.updated_at",
                rows);
        Map<Long, Long> valueIds = new HashMap<>();
        jdbc.query(
                "select v.answer_id,v.id from student_answer_values v join student_answers s on s.id=v.student_answer_id where s.attempt_id=:id",
                p("id", id),
                (org.springframework.jdbc.core.RowCallbackHandler) r -> valueIds.put(r.getLong(1), r.getLong(2)));
        jdbc.update(
                "delete from student_answer_options where answer_value_id in (select v.id from student_answer_values v join student_answers s on s.id=v.student_answer_id where s.attempt_id=:id)",
                p("id", id));
        rows.clear();
        for (var value : values.values()) {
            if (value.selectedOptionIds() != null)
                for (Long option : value.selectedOptionIds())
                    rows.add(p("value", valueIds.get(value.answerId()), "option", option, "bool", null));
            if (value.booleanAnswers() != null)
                for (var item : value.booleanAnswers())
                    rows.add(p("value", valueIds.get(value.answerId()), "option", item.optionId(), "bool",
                            item.value()));
        }
        batch("insert into student_answer_options(answer_value_id,option_id,boolean_value) values (:value,:option,:bool)",
                rows);
        if (scores != null) {
            rows.clear();
            for (var q : scores.questions())
                rows.add(p("id", questions.get(q.questionId()), "auto", q.autoScore(), "manual", q.manualScore(),
                        "status", q.status().name(), "teacher",
                        q.status() == GradingStatus.MANUAL_GRADED ? teacherId : null, "now", now));
            batch("update student_answers set auto_score=:auto,manual_score=:manual,grading_status=:status,graded_by=:teacher,graded_at=:now,updated_at=:now where id=:id",
                    rows);
            rows.clear();
            for (var s : scores.sections())
                rows.add(p("id", id, "section", s.sectionId(), "auto", s.autoScore(), "manual", s.manualScore(),
                        "total", s.totalScore(), "now", now));
            batch("insert into attempt_section_scores(attempt_id,section_id,auto_score,manual_score,total_score,created_at,updated_at) values (:id,:section,:auto,:manual,:total,:now,:now) on conflict (attempt_id,section_id) do update set auto_score=excluded.auto_score,manual_score=excluded.manual_score,total_score=excluded.total_score,updated_at=excluded.updated_at",
                    rows);
        }
    }

    private static MapSqlParameterSource p(Object... items) {
        var p = new MapSqlParameterSource();
        for (int i = 0; i < items.length; i += 2)
            p.addValue((String) items[i], items[i + 1]);
        return p;
    }

    private void batch(String sql, List<MapSqlParameterSource> parameters) {
        if (!parameters.isEmpty())
            jdbc.batchUpdate(sql, parameters.toArray(SqlParameterSource[]::new));
    }
}
