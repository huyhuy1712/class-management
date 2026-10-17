package com.classmanagement.backend.repository.exam.attempt;

import com.classmanagement.backend.dto.exam.ExamAttemptPayload;
import com.classmanagement.backend.dto.exam.ExamAttemptResponse;
import com.classmanagement.backend.entity.enums.ExamAttemptEventType;
import com.classmanagement.backend.repository.exam.ExamAttemptDataRepository.Ref;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;

/** Attempt lookup, expiry, reset and event persistence. */
@RequiredArgsConstructor
public class ExamAttemptLifecycleStore {

    private final NamedParameterJdbcTemplate jdbc;

    public Optional<Ref> ref(Long id) {
        return jdbc.query(
                "select t.id,a.exam_id,t.student_id,t.assignment_id from exam_attempts t join exam_assignments a on a.id=t.assignment_id where t.id=:id",
                p("id", id), (r, i) -> new Ref(r.getLong(1), r.getLong(2), r.getLong(3), r.getLong(4))).stream()
                .findFirst();
    }

    public Optional<Long> assignmentExamId(Long id) {
        return jdbc.query("select exam_id from exam_assignments where id=:id", p("id", id), (r, i) -> r.getLong(1))
                .stream().findFirst();
    }

    public List<Ref> expired(LocalDateTime now, int expiryBatchSize) {
        return jdbc.query(
                "select t.id,a.exam_id,t.student_id,t.assignment_id from exam_attempts t join exam_assignments a on a.id=t.assignment_id where t.status='IN_PROGRESS' and (t.deadline_at<=:now or t.deadline_at is null) order by a.exam_id,t.id limit :limit",
                p("now", now, "limit", Math.min(100, Math.max(1, expiryBatchSize))),
                (r, i) -> new Ref(r.getLong(1), r.getLong(2), r.getLong(3), r.getLong(4)));
    }

    public void reset(Long id) {
        jdbc.update("delete from student_answers where attempt_id=:id", p("id", id));
        jdbc.update("delete from attempt_section_scores where attempt_id=:id", p("id", id));
        jdbc.update("delete from exam_attempt_events where attempt_id=:id", p("id", id));
    }

    public int events(Long id, List<ExamAttemptPayload.Event> events, LocalDateTime now) {
        List<MapSqlParameterSource> rows = new ArrayList<>();
        if (events != null)
            for (var event : events)
                rows.add(p("id", id, "event", event.eventId(), "type", event.type().name(), "now", now));
        batch("insert into exam_attempt_events(attempt_id,client_event_id,event_type,event_time) values (:id,:event,:type,:now) on conflict (attempt_id,client_event_id) do nothing",
                rows);
        return jdbc.queryForObject(
                "select count(*) from exam_attempt_events where attempt_id=:id and event_type='TAB_HIDDEN'",
                p("id", id), Integer.class);
    }

    public List<ExamAttemptResponse.Event> readEvents(Long id) {
        return jdbc.query(
                "select client_event_id,event_type,event_time from exam_attempt_events where attempt_id=:id order by id desc limit 1000",
                p("id", id),
                (r, i) -> new ExamAttemptResponse.Event(r.getObject(1, UUID.class),
                        ExamAttemptEventType.valueOf(r.getString(2)),
                        r.getObject(3, LocalDateTime.class).atOffset(ZoneOffset.ofHours(7))));
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
