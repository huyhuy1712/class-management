package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.dto.exam.StudentExamResponse;
import com.classmanagement.backend.dto.exam.StudentGradesResponse;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
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

    // Shared shape for the grade page; score keys never enter a student response.
    private static final String GRADE_FROM="""
        from exam_attempts t join exam_assignments a on a.id=t.assignment_id join exams e on e.id=a.exam_id
        left join subjects sub on sub.id=e.subject_id
        where t.student_id=:studentId and t.status in ('GRADED','SUBMITTED')
        """;
    private static final String GRADE_SCOPE="""
        and (cast(:subjectId as bigint) is null or e.subject_id=:subjectId)
        and (cast(:from as timestamp) is null or t.submitted_at>=:from)
        and (cast(:to as timestamp) is null or t.submitted_at<:to)
        and (cast(:classId as bigint) is null or exists(select 1 from classes c where c.id=:classId and (
          (a.assignment_type='STUDENT' and exists(select 1 from exam_assignment_students s where s.assignment_id=a.id and s.student_id=:studentId and s.class_id=c.id))
          or (a.assignment_type in ('ALL','CLASS') and c.status='ACTIVE' and exists(select 1 from class_students cs where cs.class_id=c.id and cs.student_id=:studentId)
            and ((a.assignment_type='ALL' and c.teacher_id=e.teacher_id) or (a.assignment_type='CLASS' and exists(select 1 from exam_assignment_classes ac where ac.assignment_id=a.id and ac.class_id=c.id))))
        )))
        """;
    private static final String GRADE_VISIBLE="""
        (a.score_visibility='AFTER_SUBMIT' or (a.score_visibility='AFTER_EXAM' and
          (a.results_released_at is not null or not exists(select 1 from exam_assignment_completion_students r
             where r.assignment_id=a.id and r.completed_at is null and r.exempt_at is null))))
        """;
    private static final String GRADE_CTE="with scoped as (select t.id,t.assignment_id,e.title,e.code,t.status,t.attempt_count,t.submitted_at,t.duration_seconds,t.teacher_comment,e.subject_id,sub.name subject_name,"
            +GRADE_VISIBLE+" visible,case when t.status='GRADED' and e.max_score>0 and "+GRADE_VISIBLE+
            " then round(t.total_score*10.0/e.max_score,2) end score "+GRADE_FROM+GRADE_SCOPE+") ";
    private static final String GRADE_TABLE_FILTER="(cast(:status as varchar) is null or status=:status) and (:q='' or lower(title) like :pattern escape '!' or lower(code) like :pattern escape '!')";

    public StudentGradesResponse grades(MapSqlParameterSource p,String sort,int page,int size,boolean includeCharts) {
        String aggregate=GRADE_CTE+", frequencies as (select score,count(*) n from scoped where score is not null group by score) "+
                "select count(*) filter(where "+GRADE_TABLE_FILTER+"),avg(score),max(score),min(score),count(score),count(*) filter(where status='SUBMITTED'),count(*) filter(where status='GRADED' and not visible),count(*) filter(where score>=5),"+
                "count(*) filter(where score<5),count(*) filter(where score>=5 and score<6.5),count(*) filter(where score>=6.5 and score<8),count(*) filter(where score>=8),"+
                "(select array_agg(score order by score) from frequencies where n=(select max(n) from frequencies) and n>1) from scoped";
        record Overview(long count,StudentGradesResponse.Summary summary,List<Long> bands) {}
        var overview=jdbc.queryForObject(aggregate,p,(r,i)-> {
            var array=r.getArray(13);
            List<BigDecimal> modes=array==null?List.of():Arrays.stream((Object[])array.getArray()).map(v->new BigDecimal(v.toString())).toList();
            if(array!=null) array.free();
            long graded=r.getLong(5),passed=r.getLong(8);
            BigDecimal rate=graded==0?null:BigDecimal.valueOf(passed*100).divide(BigDecimal.valueOf(graded),2,java.math.RoundingMode.HALF_UP);
            return new Overview(r.getLong(1),new StudentGradesResponse.Summary(decimal(r.getBigDecimal(2)),r.getBigDecimal(3),r.getBigDecimal(4),modes,
                    graded,r.getLong(6),r.getLong(7),passed,rate),List.of(r.getLong(9),r.getLong(10),r.getLong(11),r.getLong(12)));
        });
        // Options independent of selected filters; read assignment IDs once, then reuse batch class resolver.
        record OptionRow(Long assignmentId,Long subjectId,String name) {}
        var options=jdbc.query("select distinct a.id,e.subject_id,sub.name "+GRADE_FROM+" order by a.id",p,
                (r,i)->new OptionRow(r.getLong(1),r.getObject(2,Long.class),r.getString(3)));
        var classes=findClasses(options.stream().map(OptionRow::assignmentId).toList(),((Number)p.getValue("studentId")).longValue());
        var classOptions=classes.values().stream().flatMap(List::stream).map(c->new StudentGradesResponse.Option(c.id(),c.name()))
                .distinct().sorted(Comparator.comparing(StudentGradesResponse.Option::id)).toList();
        var subjects=options.stream().filter(o->o.subjectId()!=null).map(o->new StudentGradesResponse.Option(o.subjectId(),o.name()))
                .distinct().sorted(Comparator.comparing(StudentGradesResponse.Option::id)).toList();
        String order=switch(sort) { case "newest"->"submitted_at desc nulls last,id desc"; case "score"->"score desc nulls last,id desc"; default->throw new IllegalArgumentException("sort không hợp lệ"); };
        var items=jdbc.query(GRADE_CTE+"select * from scoped where "+GRADE_TABLE_FILTER+" order by "+order+" limit :limit offset :offset",p,
                (r,i)->new StudentGradesResponse.Item(r.getLong("id"),r.getLong("assignment_id"),r.getString("title"),r.getString("code"),
                        r.getObject("subject_id",Long.class),r.getString("subject_name"),classes.getOrDefault(r.getLong("assignment_id"),List.of()),
                        r.getInt("attempt_count"),r.getString("status"),r.getBoolean("visible"),r.getBigDecimal("score"),
                        gradeTime(r.getObject("submitted_at",LocalDateTime.class)),r.getObject("duration_seconds",Integer.class),r.getString("teacher_comment")));
        StudentGradesResponse.Charts charts=null;
        if(includeCharts) {
            var timeline=new ArrayList<>(jdbc.query(GRADE_CTE+"select id,assignment_id,title,attempt_count,submitted_at,score from scoped where score is not null order by submitted_at desc nulls last,id desc limit 200",p,
                    (r,i)->new StudentGradesResponse.Point(r.getLong(1),r.getLong(2),r.getString(3),r.getInt(4),gradeTime(r.getObject(5,LocalDateTime.class)),r.getBigDecimal(6))));
            Collections.reverse(timeline);
            charts=new StudentGradesResponse.Charts(timeline,overview.summary().gradedCount()>200,overview.bands(),overview.summary().gradedCount(),overview.summary().pendingGradingCount());
        }
        return new StudentGradesResponse(new StudentGradesResponse.Filters(classOptions,subjects),overview.summary(),charts,items,page,size,overview.count());
    }
    private static BigDecimal decimal(BigDecimal value) { return value==null?null:value.setScale(2,java.math.RoundingMode.HALF_UP); }
    private static OffsetDateTime gradeTime(LocalDateTime value) { return value==null?null:value.atOffset(ZoneOffset.ofHours(7)); }
}
