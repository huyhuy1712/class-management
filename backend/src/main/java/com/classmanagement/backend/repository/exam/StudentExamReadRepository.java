package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.dto.exam.StudentExamResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.*;

@Repository
@RequiredArgsConstructor
public class StudentExamReadRepository {
    private final NamedParameterJdbcTemplate jdbc;

    // One shared access predicate for both list and assignment detail.
    public static final String ELIGIBILITY = """
        (
          (a.assignment_type = 'STUDENT' and exists (
             select 1 from exam_assignment_students s where s.assignment_id=a.id and s.student_id=:studentId))
          or (a.assignment_type = 'CLASS' and exists (
             select 1 from exam_assignment_classes ac join class_students cs on cs.class_id=ac.class_id
             join classes c on c.id=cs.class_id
             where ac.assignment_id=a.id and cs.student_id=:studentId and c.status='ACTIVE'))
          or (a.assignment_type = 'ALL' and exists (
             select 1 from class_students cs join classes c on c.id=cs.class_id
             where cs.student_id=:studentId and c.teacher_id=e.teacher_id and c.status='ACTIVE'))
        )
        """;
    private static final String ACCESS = "e.status = 'PUBLISHED' and a.status <> 'DRAFT' and " + ELIGIBILITY;
    private static final String FROM = """
        from exam_assignments a join exams e on e.id=a.exam_id
        left join exam_attempts t on t.assignment_id=a.id and t.student_id=:studentId
        """;
    private static final String SELECT = """
        select a.id assignment_id, e.id exam_id, e.title, e.code, e.description,
          e.status exam_status, a.status assignment_status, a.assignment_type,
          a.open_time, a.close_time, coalesce(a.time_limit,e.time_limit) time_limit,
          coalesce(t.attempt_limit_override,a.max_attempts,e.max_attempts) max_attempts,
          t.id attempt_id, coalesce(t.attempt_count,0) attempts_used,
          case when t.teacher_blocked then 'TEACHER_BLOCKED' else coalesce(t.status,'NOT_STARTED') end attempt_status, t.started_at
        """;
    private static final String FILTER = """
        and (:q = '' or lower(e.title) like :pattern escape '!' or lower(e.code) like :pattern escape '!')
        and (cast(:dayStart as timestamp) is null or (a.open_time >= :dayStart and a.open_time < :dayEnd))
        and (cast(:classId as bigint) is null or (
          (a.assignment_type='STUDENT' and exists (
             select 1 from exam_assignment_students s
             where s.assignment_id=a.id and s.student_id=:studentId and s.class_id=:classId))
          or (a.assignment_type in ('ALL','CLASS') and exists (
             select 1 from class_students cs join classes c on c.id=cs.class_id
             where cs.student_id=:studentId and c.id=:classId and c.status='ACTIVE'
             and ((a.assignment_type='ALL' and c.teacher_id=e.teacher_id)
               or (a.assignment_type='CLASS' and exists (
                 select 1 from exam_assignment_classes ac where ac.assignment_id=a.id and ac.class_id=c.id)))))
        ))
        """;

    public record Row(Long assignmentId, Long examId, String title, String code, String description,
            String examStatus, String assignmentStatus, String assignmentType,
            LocalDateTime openTime, LocalDateTime closeTime, Integer timeLimit, Integer maxAttempts,
            int attemptsUsed, Long attemptId, String attemptStatus, LocalDateTime startedAt) {}

    public List<Row> findPage(MapSqlParameterSource parameters, String sort) {
        String order = switch (sort) {
            case "oldest" -> "a.created_at asc, a.id asc";
            case "opening" -> "a.open_time asc nulls last, a.id desc";
            default -> "a.created_at desc, a.id desc";
        };
        return jdbc.query(SELECT + FROM + " where " + ACCESS + FILTER
                + " order by " + order + " limit :size offset :offset", parameters, this::mapRow);
    }

    public long countFiltered(MapSqlParameterSource parameters) {
        return jdbc.queryForObject("select count(*) " + FROM + " where " + ACCESS + FILTER, parameters, Long.class);
    }

    public StudentExamResponse.Stats stats(long studentId) {
        return jdbc.queryForObject("""
            select count(*) filter (where t.status='GRADED') completed,
              count(*) filter (where t.id is null or t.status='NOT_STARTED') not_started,
              count(*) filter (where t.status='SUBMITTED') pending
            """ + FROM + " where " + ACCESS, Map.of("studentId", studentId),
                (rs, i) -> new StudentExamResponse.Stats(rs.getLong("completed"), rs.getLong("not_started"), rs.getLong("pending")));
    }

    public Optional<Row> findAccessible(long assignmentId, long studentId) {
        return jdbc.query(SELECT + FROM + " where " + ACCESS + " and a.id=:assignmentId",
                Map.of("assignmentId", assignmentId, "studentId", studentId), this::mapRow).stream().findFirst();
    }

    public Map<Long, List<StudentExamResponse.ClassInfo>> findClasses(List<Long> assignmentIds, long studentId) {
        if (assignmentIds.isEmpty()) return Map.of();
        var results = new LinkedHashMap<Long, List<StudentExamResponse.ClassInfo>>();
        jdbc.query("""
            select a.id assignment_id, c.id class_id, c.name
            from exam_assignments a join exams e on e.id=a.exam_id join classes c on (
              (a.assignment_type='STUDENT' and exists (
                select 1 from exam_assignment_students s where s.assignment_id=a.id
                and s.student_id=:studentId and s.class_id=c.id))
              or (a.assignment_type in ('ALL','CLASS') and c.status='ACTIVE'
                and exists (select 1 from class_students cs where cs.class_id=c.id and cs.student_id=:studentId)
                and ((a.assignment_type='ALL' and c.teacher_id=e.teacher_id)
                  or (a.assignment_type='CLASS' and exists (
                    select 1 from exam_assignment_classes ac where ac.assignment_id=a.id and ac.class_id=c.id))))
            ) where a.id in (:ids) order by a.id, c.id
            """, new MapSqlParameterSource("studentId", studentId).addValue("ids", assignmentIds),
                (org.springframework.jdbc.core.RowCallbackHandler) rs -> results
                        .computeIfAbsent(rs.getLong("assignment_id"), k -> new ArrayList<>())
                        .add(new StudentExamResponse.ClassInfo(rs.getLong("class_id"), rs.getString("name"))));
        return results;
    }

    private Row mapRow(ResultSet rs, int index) throws SQLException {
        return new Row(rs.getLong("assignment_id"), rs.getLong("exam_id"), rs.getString("title"), rs.getString("code"),
                rs.getString("description"), rs.getString("exam_status"), rs.getString("assignment_status"),
                rs.getString("assignment_type"), rs.getObject("open_time", LocalDateTime.class),
                rs.getObject("close_time", LocalDateTime.class), rs.getObject("time_limit", Integer.class),
                rs.getObject("max_attempts", Integer.class), rs.getInt("attempts_used"),
                rs.getObject("attempt_id", Long.class), rs.getString("attempt_status"),
                rs.getObject("started_at", LocalDateTime.class));
    }
}
