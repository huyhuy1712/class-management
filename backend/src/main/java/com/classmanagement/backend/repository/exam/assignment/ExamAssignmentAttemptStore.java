package com.classmanagement.backend.repository.exam.assignment;

import com.classmanagement.backend.dto.exam.ClassExamResponse;
import com.classmanagement.backend.dto.exam.ExamAttemptResponse;
import com.classmanagement.backend.entity.enums.ExamAttemptStatus;
import com.classmanagement.backend.repository.exam.StudentExamReadRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

/** Assignment access, participant lists and completion snapshots. */
@RequiredArgsConstructor
public class ExamAssignmentAttemptStore {

    private final NamedParameterJdbcTemplate jdbc;

    public boolean ownsExamClass(String username, Long classId) {
        return Boolean.TRUE.equals(jdbc.queryForObject("""
                select exists(select 1 from classes c join users u on u.id=c.teacher_id
                    where c.id=:classId and u.username=:username and u.role='TEACHER' and u.status='ACTIVE')
                """, p("classId", classId, "username", username), Boolean.class));
    }

    public List<ClassExamResponse> classExams(Long classId) {
        return jdbc.query("""
                select a.id assignment_id, e.id exam_id, e.title, e.code, e.status exam_status,
                    a.status assignment_status, a.assignment_type, coalesce(a.time_limit,e.time_limit) time_limit,
                    a.open_time, a.close_time, a.created_at,
                    count(t.id) filter (where t.status='GRADED') graded_count,
                    count(t.id) filter (where t.status='SUBMITTED') pending_count
                from classes c join exams e on e.teacher_id=c.teacher_id
                join exam_assignments a on a.exam_id=e.id
                left join exam_attempts t on t.assignment_id=a.id and (
                    (a.assignment_type='STUDENT' and exists (
                        select 1 from exam_assignment_students s where s.assignment_id=a.id
                            and s.student_id=t.student_id and s.class_id=c.id))
                    or (a.assignment_type<>'STUDENT' and exists (
                        select 1 from class_students cs where cs.class_id=c.id and cs.student_id=t.student_id)))
                where c.id=:classId and (
                    (a.assignment_type='ALL' and c.status='ACTIVE')
                    or (a.assignment_type='CLASS' and exists (
                        select 1 from exam_assignment_classes ac where ac.assignment_id=a.id and ac.class_id=c.id))
                    or (a.assignment_type='STUDENT' and exists (
                        select 1 from exam_assignment_students s where s.assignment_id=a.id and s.class_id=c.id)))
                group by a.id,e.id
                order by a.created_at desc, a.id desc
                """, p("classId", classId),
                (r, i) -> new ClassExamResponse(r.getLong("assignment_id"), r.getLong("exam_id"), r.getString("title"),
                        r.getString("code"), r.getString("exam_status"), r.getString("assignment_status"),
                        r.getString("assignment_type"), r.getObject("time_limit", Integer.class),
                        r.getObject("open_time", LocalDateTime.class), r.getObject("close_time", LocalDateTime.class),
                        r.getObject("created_at", LocalDateTime.class), r.getLong("graded_count"),
                        r.getLong("pending_count")));
    }

    public void clearCohort(Long examId) {
        jdbc.update(
                "delete from exam_assignment_completion_students where assignment_id in (select id from exam_assignments where exam_id=:id)",
                p("id", examId));
        jdbc.update("update exam_assignments set results_released_at=null where exam_id=:id", p("id", examId));
    }

    public void snapshot(Long examId) {
        clearCohort(examId);
        jdbc.update(
                "insert into exam_assignment_completion_students(assignment_id,student_id) select a.id,u.id from exam_assignments a join exams e on e.id=a.exam_id cross join users u where a.exam_id=:id and u.role='STUDENT' and u.status='ACTIVE' and "
                        + StudentExamReadRepository.ELIGIBILITY.replace(":studentId", "u.id"),
                p("id", examId));
    }

    public void snapshotAssignment(Long assignmentId) {
        jdbc.update(
                "insert into exam_assignment_completion_students(assignment_id,student_id) select a.id,u.id from exam_assignments a join exams e on e.id=a.exam_id cross join users u where a.id=:id and u.role='STUDENT' and u.status='ACTIVE' and "
                        + StudentExamReadRepository.ELIGIBILITY.replace(":studentId", "u.id"),
                p("id", assignmentId));
    }

    public void completed(Long assignmentId, Long studentId, LocalDateTime now) {
        jdbc.update(
                "update exam_assignment_completion_students set completed_at=coalesce(completed_at,:now) where assignment_id=:id and student_id=:student",
                p("id", assignmentId, "student", studentId, "now", now));
    }

    public void resetCompletion(Long assignmentId, Long studentId) {
        jdbc.update(
                "update exam_assignment_completion_students set completed_at=null,exempt_at=null where assignment_id=:id and student_id=:student",
                p("id", assignmentId, "student", studentId));
    }

    public boolean released(Long assignmentId, LocalDateTime now) {
        jdbc.update(
                "update exam_assignment_completion_students r set exempt_at=:now where r.assignment_id=:id and r.completed_at is null and r.exempt_at is null and not exists (select 1 from exam_attempts t where t.assignment_id=r.assignment_id and t.student_id=r.student_id and t.status='IN_PROGRESS') and not exists (select 1 from exam_assignments a join exams e on e.id=a.exam_id join users u on u.id=r.student_id where a.id=r.assignment_id and u.role='STUDENT' and u.status='ACTIVE' and "
                        + StudentExamReadRepository.ELIGIBILITY.replace(":studentId", "r.student_id") + ")",
                p("id", assignmentId, "now", now));
        jdbc.update(
                "update exam_assignments set results_released_at=:now where id=:id and results_released_at is null and not exists (select 1 from exam_assignment_completion_students r where r.assignment_id=:id and r.completed_at is null and r.exempt_at is null)",
                p("id", assignmentId, "now", now));
        return Boolean.TRUE
                .equals(jdbc.queryForObject("select results_released_at is not null from exam_assignments where id=:id",
                        p("id", assignmentId), Boolean.class));
    }

    public boolean classAllowed(Long assignmentId, Long classId) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
                """
                        select exists(select 1 from exam_assignments a join exams e on e.id=a.exam_id
                          join classes c on c.teacher_id=e.teacher_id where a.id=:id and c.id=:classId and (
                            (a.assignment_type='ALL' and c.status='ACTIVE')
                            or (a.assignment_type='CLASS' and exists(select 1 from exam_assignment_classes ac where ac.assignment_id=a.id and ac.class_id=c.id))
                            or (a.assignment_type='STUDENT' and exists(select 1 from exam_assignment_students s where s.assignment_id=a.id and s.class_id=c.id))
                          ))
                        """,
                p("id", assignmentId, "classId", classId), Boolean.class));
    }

    public ExamAttemptResponse.Page list(Long assignmentId, int page, int size, ExamAttemptStatus status, String q,
            String sort, Long classId) {
        String escaped = q.toLowerCase(Locale.ROOT).replace("!", "!!").replace("%", "!%").replace("_", "!_");
        var p = p("id", assignmentId, "classId", classId, "status", status == null ? null : status.name(), "q", q,
                "pattern", "%" + escaped + "%", "limit", size, "offset", (long) page * size);
        // Current recipients plus existing attempts: membership changes must not erase submitted work.
        String from = " from exam_assignments a join exams e on e.id=a.exam_id cross join users u left join exam_attempts t on t.assignment_id=a.id and t.student_id=u.id where a.id=:id and u.role='STUDENT' and (t.id is not null or (u.status='ACTIVE' and "
                + StudentExamReadRepository.ELIGIBILITY.replace(":studentId", "u.id") + "))";
        if (classId != null)
            from += " and ((a.assignment_type='STUDENT' and exists(select 1 from exam_assignment_students s where s.assignment_id=a.id and s.student_id=u.id and s.class_id=:classId)) or (a.assignment_type in ('ALL','CLASS') and exists(select 1 from class_students cs join classes c on c.id=cs.class_id where cs.student_id=u.id and cs.class_id=:classId and (t.id is not null or c.status='ACTIVE'))))";
        String filter = "(cast(:status as varchar) is null or coalesce(t.status,'NOT_STARTED')=:status) and (:q='' or lower(u.full_name) like :pattern escape '!' or lower(u.email) like :pattern escape '!' or lower(u.student_code) like :pattern escape '!')";
        String order = switch (sort) {
        case "oldest" -> "t.updated_at asc nulls last,u.id asc";
        case "name" -> "lower(u.full_name) asc,u.id asc";
        case "score_desc" -> "t.total_score desc nulls last,u.id desc";
        case "score_asc" -> "t.total_score asc nulls last,u.id asc";
        case "newest" -> "t.updated_at desc nulls last,u.id desc";
        default -> throw new IllegalArgumentException("sort khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡");
        };
        var items = jdbc.query(
                "select t.id,u.id,u.full_name,coalesce(t.attempt_count,0),coalesce(t.status,'NOT_STARTED'),coalesce(t.tab_switch_count,0),case when t.status in ('SUBMITTED','GRADED') then t.total_score end,u.avatar,u.student_code,u.email,t.started_at,t.submitted_at,t.duration_seconds,t.teacher_comment,t.revision"
                        + from + " and " + filter + " order by " + order + " limit :limit offset :offset",
                p,
                (r, i) -> new ExamAttemptResponse.Summary(r.getObject(1, Long.class), r.getLong(2), r.getString(3),
                        r.getInt(4), ExamAttemptStatus.valueOf(r.getString(5)), r.getInt(6), r.getBigDecimal(7),
                        r.getString(8), r.getString(9), r.getString(10), time(r.getObject(11, LocalDateTime.class)),
                        time(r.getObject(12, LocalDateTime.class)), r.getObject(13, Integer.class), r.getString(14),
                        "GRADED".equals(r.getString(5)), r.getObject(15, Long.class)));
        // One aggregate supplies global counters and the filtered pagination count, including empty pages.
        String aggregate = "with scoped as (select t.id,t.status,t.total_score,(" + filter + ") matches" + from
                + "), frequencies as (select total_score,count(*) frequency from scoped where status='GRADED' and total_score is not null group by total_score) "
                + "select count(*) filter (where matches),count(*),count(*) filter (where id is null or status='NOT_STARTED'),"
                + "count(*) filter (where status='IN_PROGRESS'),count(*) filter (where status='SUBMITTED'),count(*) filter (where status='GRADED'),"
                + "round(avg(total_score) filter (where status='GRADED'),3),"
                + "(select array_agg(total_score order by total_score) from frequencies where frequency=(select max(frequency) from frequencies) and frequency>1) from scoped";
        return jdbc.queryForObject(aggregate, p, (r, i) -> {
            var array = r.getArray(8);
            List<BigDecimal> modes = array == null ? List.of()
                    : Arrays.stream((Object[]) array.getArray()).map(value -> new BigDecimal(value.toString()))
                            .toList();
            if (array != null)
                array.free();
            return new ExamAttemptResponse.Page(items, page, size, r.getLong(1),
                    new ExamAttemptResponse.Stats(r.getLong(2), r.getLong(3), r.getLong(4), r.getLong(5) + r.getLong(6),
                            r.getLong(5), r.getLong(6), r.getBigDecimal(7), modes));
        });
    }

    private static MapSqlParameterSource p(Object... items) {
        var p = new MapSqlParameterSource();
        for (int i = 0; i < items.length; i += 2)
            p.addValue((String) items[i], items[i + 1]);
        return p;
    }

    private static OffsetDateTime time(LocalDateTime value) {
        return value == null ? null : value.atOffset(ZoneOffset.ofHours(7));
    }
}
