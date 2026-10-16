package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.dto.exam.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.service.exam.attempt.ExamScoringCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.*;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

/** Batch persistence for the attempt aggregate, not one repository call per answer. */
@Repository
@RequiredArgsConstructor
public class ExamAttemptDataRepository {
    private final NamedParameterJdbcTemplate jdbc;
    @org.springframework.beans.factory.annotation.Value("${app.exam.expiry-batch-size:20}")
    private int expiryBatchSize=20;
    public record Ref(Long id,Long examId,Long studentId,Long assignmentId) {}
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
                """, p("classId",classId), (r,i) -> new ClassExamResponse(r.getLong("assignment_id"),r.getLong("exam_id"),
                    r.getString("title"),r.getString("code"),r.getString("exam_status"),r.getString("assignment_status"),
                    r.getString("assignment_type"),r.getObject("time_limit",Integer.class),
                    r.getObject("open_time",LocalDateTime.class),r.getObject("close_time",LocalDateTime.class),
                    r.getObject("created_at",LocalDateTime.class),r.getLong("graded_count"),r.getLong("pending_count")));
    }
    private static MapSqlParameterSource p(Object... items) {
        var p=new MapSqlParameterSource(); for(int i=0;i<items.length;i+=2) p.addValue((String)items[i],items[i+1]); return p;
    }
    private void batch(String sql,List<MapSqlParameterSource> parameters) {
        if(!parameters.isEmpty()) jdbc.batchUpdate(sql,parameters.toArray(SqlParameterSource[]::new));
    }
    public Optional<Ref> ref(Long id) {
        return jdbc.query("select t.id,a.exam_id,t.student_id,t.assignment_id from exam_attempts t join exam_assignments a on a.id=t.assignment_id where t.id=:id",
                p("id",id),(r,i)->new Ref(r.getLong(1),r.getLong(2),r.getLong(3),r.getLong(4))).stream().findFirst();
    }
    public Optional<Long> assignmentExamId(Long id) {
        return jdbc.query("select exam_id from exam_assignments where id=:id",p("id",id),(r,i)->r.getLong(1)).stream().findFirst();
    }
    public List<Ref> expired(LocalDateTime now) {
        return jdbc.query("select t.id,a.exam_id,t.student_id,t.assignment_id from exam_attempts t join exam_assignments a on a.id=t.assignment_id where t.status='IN_PROGRESS' and (t.deadline_at<=:now or t.deadline_at is null) order by a.exam_id,t.id limit :limit",
                p("now",now,"limit",Math.min(100,Math.max(1,expiryBatchSize))),(r,i)->new Ref(r.getLong(1),r.getLong(2),r.getLong(3),r.getLong(4)));
    }
    public void reset(Long id) {
        jdbc.update("delete from student_answers where attempt_id=:id",p("id",id));
        jdbc.update("delete from attempt_section_scores where attempt_id=:id",p("id",id));
        jdbc.update("delete from exam_attempt_events where attempt_id=:id",p("id",id));
    }
    public Map<Long,Map<Long,ExamAttemptPayload.Value>> readAnswers(Collection<Long> ids) {
        if(ids.isEmpty()) return Map.of();
        record Key(Long attemptId,Long answerId) {}
        class Builder { String text; List<Long> options=new ArrayList<>(); List<ExamAttemptPayload.BooleanAnswer> bools=new ArrayList<>(); }
        Map<Key,Builder> builders=new LinkedHashMap<>();
        jdbc.query("select sa.attempt_id,v.answer_id,v.answer_text,o.option_id,o.boolean_value from student_answers sa join student_answer_values v on v.student_answer_id=sa.id left join student_answer_options o on o.answer_value_id=v.id where sa.attempt_id in (:ids) order by sa.attempt_id,v.answer_id,o.option_id",
                p("ids",ids),(org.springframework.jdbc.core.RowCallbackHandler) r->{
                    var b=builders.computeIfAbsent(new Key(r.getLong(1),r.getLong(2)),k->new Builder()); b.text=r.getString(3);
                    Long option=r.getObject(4,Long.class); Boolean bool=r.getObject(5,Boolean.class);
                    if(option!=null) { if(bool==null) b.options.add(option); else b.bools.add(new ExamAttemptPayload.BooleanAnswer(option,bool)); }
                });
        Map<Long,Map<Long,ExamAttemptPayload.Value>> result=new HashMap<>();
        builders.forEach((k,b)->result.computeIfAbsent(k.attemptId(),x->new LinkedHashMap<>()).put(k.answerId(),
                new ExamAttemptPayload.Value(k.answerId(),b.text,b.options,b.bools)));
        return result;
    }
    public Map<Long,BigDecimal> manualScores(Long id) {
        Map<Long,BigDecimal> scores=new HashMap<>();
        jdbc.query("select v.answer_id,v.score from student_answer_values v join student_answers s on s.id=v.student_answer_id join answers a on a.id=v.answer_id where s.attempt_id=:id and a.answer_type='ESSAY' and v.score is not null",
                p("id",id),(org.springframework.jdbc.core.RowCallbackHandler) r->scores.put(r.getLong(1),r.getBigDecimal(2)));
        return scores;
    }
    public void write(Long id,Long examId,List<ExamDetailResponse.Section> structure,
            Map<Long,ExamAttemptPayload.Value> values,ExamScoringCalculator.Scores scores,LocalDateTime now,Long teacherId) {
        jdbc.update("insert into student_answers(attempt_id,question_id,created_at,updated_at) select :id,q.id,:now,:now from questions q join exam_sections s on s.id=q.section_id where s.exam_id=:examId on conflict (attempt_id,question_id) do nothing",
                p("id",id,"examId",examId,"now",now));
        Map<Long,Long> questions=new HashMap<>();
        jdbc.query("select question_id,id from student_answers where attempt_id=:id",p("id",id),
                (org.springframework.jdbc.core.RowCallbackHandler) r->questions.put(r.getLong(1),r.getLong(2)));
        Map<Long,Long> parents=new HashMap<>();
        for(var s:structure) for(var q:s.questions()) for(var a:q.answers()) parents.put(a.id(),questions.get(q.id()));
        Map<Long,ExamScoringCalculator.GroupScore> grading=new HashMap<>();
        if(scores!=null) scores.groups().forEach(g->grading.put(g.answerId(),g));
        Set<Long> retained=scores==null?values.keySet():parents.keySet();
        String delete="delete from student_answer_values where student_answer_id in (select id from student_answers where attempt_id=:id)";
        jdbc.update(delete+(retained.isEmpty()?"":" and answer_id not in (:ids)"),p("id",id,"ids",retained));
        List<MapSqlParameterSource> rows=new ArrayList<>();
        for(Long answerId:retained) {
            var value=values.get(answerId); var grade=grading.get(answerId);
            rows.add(p("parent",parents.get(answerId),"answer",answerId,"text",value==null?null:value.text(),
                    "score",grade==null?null:grade.score(),"correct",grade==null?null:grade.correct(),"now",now));
        }
        batch("insert into student_answer_values(student_answer_id,answer_id,answer_text,score,is_correct,created_at,updated_at) values (:parent,:answer,:text,:score,:correct,:now,:now) on conflict (student_answer_id,answer_id) do update set answer_text=excluded.answer_text,score=excluded.score,is_correct=excluded.is_correct,updated_at=excluded.updated_at",rows);
        Map<Long,Long> valueIds=new HashMap<>();
        jdbc.query("select v.answer_id,v.id from student_answer_values v join student_answers s on s.id=v.student_answer_id where s.attempt_id=:id",p("id",id),
                (org.springframework.jdbc.core.RowCallbackHandler) r->valueIds.put(r.getLong(1),r.getLong(2)));
        jdbc.update("delete from student_answer_options where answer_value_id in (select v.id from student_answer_values v join student_answers s on s.id=v.student_answer_id where s.attempt_id=:id)",p("id",id));
        rows.clear();
        for(var value:values.values()) {
            if(value.selectedOptionIds()!=null) for(Long option:value.selectedOptionIds()) rows.add(p("value",valueIds.get(value.answerId()),"option",option,"bool",null));
            if(value.booleanAnswers()!=null) for(var item:value.booleanAnswers()) rows.add(p("value",valueIds.get(value.answerId()),"option",item.optionId(),"bool",item.value()));
        }
        batch("insert into student_answer_options(answer_value_id,option_id,boolean_value) values (:value,:option,:bool)",rows);
        if(scores!=null) {
            rows.clear();
            for(var q:scores.questions()) rows.add(p("id",questions.get(q.questionId()),"auto",q.autoScore(),"manual",q.manualScore(),
                    "status",q.status().name(),"teacher",q.status()==GradingStatus.MANUAL_GRADED?teacherId:null,"now",now));
            batch("update student_answers set auto_score=:auto,manual_score=:manual,grading_status=:status,graded_by=:teacher,graded_at=:now,updated_at=:now where id=:id",rows);
            rows.clear();
            for(var s:scores.sections()) rows.add(p("id",id,"section",s.sectionId(),"auto",s.autoScore(),"manual",s.manualScore(),"total",s.totalScore(),"now",now));
            batch("insert into attempt_section_scores(attempt_id,section_id,auto_score,manual_score,total_score,created_at,updated_at) values (:id,:section,:auto,:manual,:total,:now,:now) on conflict (attempt_id,section_id) do update set auto_score=excluded.auto_score,manual_score=excluded.manual_score,total_score=excluded.total_score,updated_at=excluded.updated_at",rows);
        }
    }
    public int events(Long id,List<ExamAttemptPayload.Event> events,LocalDateTime now) {
        List<MapSqlParameterSource> rows=new ArrayList<>();
        if(events!=null) for(var event:events) rows.add(p("id",id,"event",event.eventId(),"type",event.type().name(),"now",now));
        batch("insert into exam_attempt_events(attempt_id,client_event_id,event_type,event_time) values (:id,:event,:type,:now) on conflict (attempt_id,client_event_id) do nothing",rows);
        return jdbc.queryForObject("select count(*) from exam_attempt_events where attempt_id=:id and event_type='TAB_HIDDEN'",p("id",id),Integer.class);
    }
    public List<ExamAttemptResponse.Event> readEvents(Long id) {
        return jdbc.query("select client_event_id,event_type,event_time from exam_attempt_events where attempt_id=:id order by id desc limit 1000",p("id",id),
                (r,i)->new ExamAttemptResponse.Event(r.getObject(1,UUID.class),ExamAttemptEventType.valueOf(r.getString(2)),r.getObject(3,LocalDateTime.class).atOffset(ZoneOffset.ofHours(7))));
    }
    public void clearCohort(Long examId) {
        jdbc.update("delete from exam_assignment_completion_students where assignment_id in (select id from exam_assignments where exam_id=:id)",p("id",examId));
        jdbc.update("update exam_assignments set results_released_at=null where exam_id=:id",p("id",examId));
    }
    public void snapshot(Long examId) {
        clearCohort(examId);
        jdbc.update("insert into exam_assignment_completion_students(assignment_id,student_id) select a.id,u.id from exam_assignments a join exams e on e.id=a.exam_id cross join users u where a.exam_id=:id and u.role='STUDENT' and u.status='ACTIVE' and "
                +StudentExamReadRepository.ELIGIBILITY.replace(":studentId","u.id"),p("id",examId));
    }
    public void snapshotAssignment(Long assignmentId) {
        jdbc.update("insert into exam_assignment_completion_students(assignment_id,student_id) select a.id,u.id from exam_assignments a join exams e on e.id=a.exam_id cross join users u where a.id=:id and u.role='STUDENT' and u.status='ACTIVE' and "
                +StudentExamReadRepository.ELIGIBILITY.replace(":studentId","u.id"),p("id",assignmentId));
    }
    public void completed(Long assignmentId,Long studentId,LocalDateTime now) {
        jdbc.update("update exam_assignment_completion_students set completed_at=coalesce(completed_at,:now) where assignment_id=:id and student_id=:student",p("id",assignmentId,"student",studentId,"now",now));
    }
    public void resetCompletion(Long assignmentId,Long studentId) {
        jdbc.update("update exam_assignment_completion_students set completed_at=null,exempt_at=null where assignment_id=:id and student_id=:student",
                p("id",assignmentId,"student",studentId));
    }
    public boolean released(Long assignmentId,LocalDateTime now) {
        jdbc.update("update exam_assignment_completion_students r set exempt_at=:now where r.assignment_id=:id and r.completed_at is null and r.exempt_at is null and not exists (select 1 from exam_attempts t where t.assignment_id=r.assignment_id and t.student_id=r.student_id and t.status='IN_PROGRESS') and not exists (select 1 from exam_assignments a join exams e on e.id=a.exam_id join users u on u.id=r.student_id where a.id=r.assignment_id and u.role='STUDENT' and u.status='ACTIVE' and "
                +StudentExamReadRepository.ELIGIBILITY.replace(":studentId","r.student_id")+")",p("id",assignmentId,"now",now));
        jdbc.update("update exam_assignments set results_released_at=:now where id=:id and results_released_at is null and not exists (select 1 from exam_assignment_completion_students r where r.assignment_id=:id and r.completed_at is null and r.exempt_at is null)",p("id",assignmentId,"now",now));
        return Boolean.TRUE.equals(jdbc.queryForObject("select results_released_at is not null from exam_assignments where id=:id",p("id",assignmentId),Boolean.class));
    }
    public boolean classAllowed(Long assignmentId,Long classId) {
        return Boolean.TRUE.equals(jdbc.queryForObject("""
                select exists(select 1 from exam_assignments a join exams e on e.id=a.exam_id
                  join classes c on c.teacher_id=e.teacher_id where a.id=:id and c.id=:classId and (
                    (a.assignment_type='ALL' and c.status='ACTIVE')
                    or (a.assignment_type='CLASS' and exists(select 1 from exam_assignment_classes ac where ac.assignment_id=a.id and ac.class_id=c.id))
                    or (a.assignment_type='STUDENT' and exists(select 1 from exam_assignment_students s where s.assignment_id=a.id and s.class_id=c.id))
                  ))
                """,p("id",assignmentId,"classId",classId),Boolean.class));
    }
    public ExamAttemptResponse.Page list(Long assignmentId,int page,int size,ExamAttemptStatus status,String q,String sort,Long classId) {
        String escaped=q.toLowerCase(Locale.ROOT).replace("!","!!").replace("%","!%").replace("_","!_");
        var p=p("id",assignmentId,"classId",classId,"status",status==null?null:status.name(),"q",q,"pattern","%"+escaped+"%","limit",size,"offset",(long)page*size);
        // Current recipients plus existing attempts: membership changes must not erase submitted work.
        String from=" from exam_assignments a join exams e on e.id=a.exam_id cross join users u left join exam_attempts t on t.assignment_id=a.id and t.student_id=u.id where a.id=:id and u.role='STUDENT' and (t.id is not null or (u.status='ACTIVE' and "
                +StudentExamReadRepository.ELIGIBILITY.replace(":studentId","u.id")+"))";
        if(classId!=null) from+=" and ((a.assignment_type='STUDENT' and exists(select 1 from exam_assignment_students s where s.assignment_id=a.id and s.student_id=u.id and s.class_id=:classId)) or (a.assignment_type in ('ALL','CLASS') and exists(select 1 from class_students cs join classes c on c.id=cs.class_id where cs.student_id=u.id and cs.class_id=:classId and (t.id is not null or c.status='ACTIVE'))))";
        String filter="(cast(:status as varchar) is null or coalesce(t.status,'NOT_STARTED')=:status) and (:q='' or lower(u.full_name) like :pattern escape '!' or lower(u.email) like :pattern escape '!' or lower(u.student_code) like :pattern escape '!')";
        String order=switch(sort) {
            case "oldest"->"t.updated_at asc nulls last,u.id asc";
            case "name"->"lower(u.full_name) asc,u.id asc";
            case "score_desc"->"t.total_score desc nulls last,u.id desc";
            case "score_asc"->"t.total_score asc nulls last,u.id asc";
            case "newest"->"t.updated_at desc nulls last,u.id desc";
            default->throw new IllegalArgumentException("sort không hợp lệ");
        };
        var items=jdbc.query("select t.id,u.id,u.full_name,coalesce(t.attempt_count,0),coalesce(t.status,'NOT_STARTED'),coalesce(t.tab_switch_count,0),case when t.status in ('SUBMITTED','GRADED') then t.total_score end,u.avatar,u.student_code,u.email,t.started_at,t.submitted_at,t.duration_seconds,t.teacher_comment,t.revision"+from+" and "+filter+" order by "+order+" limit :limit offset :offset",p,
                (r,i)->new ExamAttemptResponse.Summary(r.getObject(1,Long.class),r.getLong(2),r.getString(3),r.getInt(4),ExamAttemptStatus.valueOf(r.getString(5)),r.getInt(6),r.getBigDecimal(7),
                        r.getString(8),r.getString(9),r.getString(10),time(r.getObject(11,LocalDateTime.class)),time(r.getObject(12,LocalDateTime.class)),
                        r.getObject(13,Integer.class),r.getString(14),"GRADED".equals(r.getString(5)),r.getObject(15,Long.class)));
        // One aggregate supplies global counters and the filtered pagination count, including empty pages.
        String aggregate="with scoped as (select t.id,t.status,t.total_score,("+filter+") matches"+from+
                "), frequencies as (select total_score,count(*) frequency from scoped where status='GRADED' and total_score is not null group by total_score) "
                +"select count(*) filter (where matches),count(*),count(*) filter (where id is null or status='NOT_STARTED'),"
                +"count(*) filter (where status='IN_PROGRESS'),count(*) filter (where status='SUBMITTED'),count(*) filter (where status='GRADED'),"
                +"round(avg(total_score) filter (where status='GRADED'),3),"
                +"(select array_agg(total_score order by total_score) from frequencies where frequency=(select max(frequency) from frequencies) and frequency>1) from scoped";
        return jdbc.queryForObject(aggregate,p,(r,i)-> {
            var array=r.getArray(8);
            List<BigDecimal> modes=array==null?List.of():Arrays.stream((Object[])array.getArray())
                    .map(value->new BigDecimal(value.toString())).toList();
            if(array!=null) array.free();
            return new ExamAttemptResponse.Page(items,page,size,r.getLong(1),new ExamAttemptResponse.Stats(
                    r.getLong(2),r.getLong(3),r.getLong(4),r.getLong(5)+r.getLong(6),r.getLong(5),r.getLong(6),r.getBigDecimal(7),modes));
        });
    }
    private static OffsetDateTime time(LocalDateTime value) { return value==null?null:value.atOffset(ZoneOffset.ofHours(7)); }

    public boolean studentClassAllowed(Long classId,Long studentId,Long teacherId) {
        return Boolean.TRUE.equals(jdbc.queryForObject("""
                select exists(select 1 from classes c join class_students cs on cs.class_id=c.id
                  join users u on u.id=cs.student_id where c.id=:classId and c.teacher_id=:teacherId
                  and cs.student_id=:studentId and u.role='STUDENT')
                """,p("classId",classId,"studentId",studentId,"teacherId",teacherId),Boolean.class));
    }

    public Optional<ClassGradebookResponse.ClassInfo> gradebookClass(Long classId,Long teacherId) {
        return jdbc.query("select c.id,c.name,c.subject_id,s.name from classes c left join subjects s on s.id=c.subject_id where c.id=:classId and c.teacher_id=:teacherId",
                p("classId",classId,"teacherId",teacherId),(r,i)->new ClassGradebookResponse.ClassInfo(r.getLong(1),r.getString(2),r.getObject(3,Long.class),r.getString(4))).stream().findFirst();
    }

    public ClassGradebookResponse gradebook(ClassGradebookResponse.ClassInfo classroom,Long teacherId,int page,int size,String q,Long subjectId) {
        Long classId=classroom.id();
        var parameters=p("classId",classId,"teacherId",teacherId,"subjectId",subjectId,"q",q,
                "pattern","%"+q.replace("!","!!").replace("%","!%").replace("_","!_")+"%","limit",size,"offset",(long)page*size);
        String roster=" from class_students cs join users u on u.id=cs.student_id where cs.class_id=:classId and u.role='STUDENT' and (:q='' or lower(u.full_name) like :pattern escape '!' or lower(u.email) like :pattern escape '!' or lower(u.student_code) like :pattern escape '!' or lower(u.username) like :pattern escape '!' or u.phone like :pattern escape '!' or cast(u.id as varchar)=:q)";
        long count=jdbc.queryForObject("select count(*)"+roster,parameters,Long.class);
        var students=jdbc.query("select u.id,u.student_code,u.full_name,u.email,u.phone,u.avatar,cs.joined_at"+roster+" order by lower(u.full_name),u.id limit :limit offset :offset",parameters,
                (r,i)->new ClassGradebookResponse.Student(r.getLong(1),r.getString(2),r.getString(3),r.getString(4),r.getString(5),r.getString(6),time(r.getObject(7,LocalDateTime.class)),null,0,List.of()));
        var columns=jdbc.query("""
                select a.id,e.id,e.title,e.code,a.assignment_type,e.max_score
                from exam_assignments a join exams e on e.id=a.exam_id join classes c on c.id=:classId
                where e.teacher_id=:teacherId and c.teacher_id=:teacherId and e.status<>'DRAFT' and a.status<>'DRAFT'
                  and (cast(:subjectId as bigint) is null or e.subject_id=:subjectId) and (
                    (a.assignment_type in ('ALL','CLASS') and (a.assignment_type='ALL' or exists(select 1 from exam_assignment_classes ac where ac.assignment_id=a.id and ac.class_id=c.id))
                      and (c.status='ACTIVE' or exists(select 1 from exam_attempts t join class_students cs on cs.student_id=t.student_id where t.assignment_id=a.id and cs.class_id=c.id)))
                    or (a.assignment_type='STUDENT' and exists(select 1 from exam_assignment_students s join class_students cs on cs.student_id=s.student_id
                      where s.assignment_id=a.id and s.class_id=c.id and cs.class_id=c.id))
                  ) order by a.created_at,a.id
                """,parameters,(r,i)->new ClassGradebookResponse.Column(r.getLong(1),r.getLong(2),r.getString(3),r.getString(4),ExamAssignmentType.valueOf(r.getString(5)),r.getBigDecimal(6)));
        if(students.isEmpty()||columns.isEmpty()) return new ClassGradebookResponse(classroom,columns,students,page,size,count);
        parameters.addValue("students",students.stream().map(ClassGradebookResponse.Student::studentId).toList())
                .addValue("assignments",columns.stream().map(ClassGradebookResponse.Column::assignmentId).toList());
        var cells=jdbc.query("""
                select u.id,a.id,
                  case when a.assignment_type='STUDENT' then exists(select 1 from exam_assignment_students s where s.assignment_id=a.id and s.student_id=u.id and s.class_id=:classId)
                    else (c.status='ACTIVE' or t.id is not null) end assigned,
                  t.id,coalesce(t.attempt_count,0),coalesce(t.status,'NOT_STARTED'),
                  case when t.status='GRADED' then t.total_score end,
                  case when t.status='GRADED' and e.max_score>0 then t.total_score*10.0/e.max_score end,t.submitted_at
                from users u cross join exam_assignments a join exams e on e.id=a.exam_id join classes c on c.id=:classId
                left join exam_attempts t on t.assignment_id=a.id and t.student_id=u.id
                where u.id in (:students) and a.id in (:assignments)
                """,parameters,(r,i)->Map.entry(r.getLong(1),new ClassGradebookResponse.Cell(r.getLong(2),r.getBoolean(3),r.getObject(4,Long.class),r.getInt(5),
                        ExamAttemptStatus.valueOf(r.getString(6)),r.getBigDecimal(7),r.getBigDecimal(8),time(r.getObject(9,LocalDateTime.class)))));
        var byStudent=new HashMap<Long,List<ClassGradebookResponse.Cell>>();
        var sums=new HashMap<Long,BigDecimal>(); var counts=new HashMap<Long,Long>();
        for(var entry:cells) {
            var cell=entry.getValue();
            if(cell.assigned()&&cell.scoreOnTen()!=null) {
                sums.merge(entry.getKey(),cell.scoreOnTen(),BigDecimal::add); counts.merge(entry.getKey(),1L,Long::sum);
            }
            if(!cell.assigned()) cell=new ClassGradebookResponse.Cell(cell.assignmentId(),false,null,0,null,null,null,null);
            else if(cell.scoreOnTen()!=null) cell=new ClassGradebookResponse.Cell(cell.assignmentId(),true,cell.attemptId(),cell.attemptNumber(),cell.status(),cell.totalScore(),
                    cell.scoreOnTen().setScale(3,java.math.RoundingMode.HALF_UP),cell.submittedAt());
            byStudent.computeIfAbsent(entry.getKey(),id->new ArrayList<>()).add(cell);
        }
        var order=new HashMap<Long,Integer>(); for(int i=0;i<columns.size();i++) order.put(columns.get(i).assignmentId(),i);
        var rows=students.stream().map(student-> {
            long graded=counts.getOrDefault(student.studentId(),0L);
            BigDecimal average=graded==0?null:sums.get(student.studentId()).divide(BigDecimal.valueOf(graded),3,java.math.RoundingMode.HALF_UP);
            var values=byStudent.getOrDefault(student.studentId(),new ArrayList<>()); values.sort(Comparator.comparing(c->order.get(c.assignmentId())));
            return new ClassGradebookResponse.Student(student.studentId(),student.studentCode(),student.fullName(),student.email(),student.phone(),student.avatarUrl(),student.joinedAt(),average,graded,values);
        }).toList();
        return new ClassGradebookResponse(classroom,columns,rows,page,size,count);
    }

    public StudentClassExamResultsResponse studentClassResults(Long classId,Long studentId,Long teacherId,int page,int size) {
        var parameters=p("classId",classId,"studentId",studentId,"teacherId",teacherId,"limit",size,"offset",(long)page*size);
        String from="""
                from exam_assignments a join exams e on e.id=a.exam_id
                join classes c on c.id=:classId and c.teacher_id=e.teacher_id
                left join exam_attempts t on t.assignment_id=a.id and t.student_id=:studentId
                where e.teacher_id=:teacherId and e.status<>'DRAFT' and a.status<>'DRAFT' and (
                  (a.assignment_type='ALL' and (c.status='ACTIVE' or t.id is not null))
                  or (a.assignment_type='CLASS' and (c.status='ACTIVE' or t.id is not null) and exists(
                    select 1 from exam_assignment_classes ac where ac.assignment_id=a.id and ac.class_id=:classId))
                  or (a.assignment_type='STUDENT' and exists(select 1 from exam_assignment_students s
                    where s.assignment_id=a.id and s.student_id=:studentId and s.class_id=:classId))
                )
                """;
        String normalized="case when t.status='GRADED' and e.max_score>0 then t.total_score*10.0/e.max_score end";
        var items=jdbc.query("select a.id,e.id,e.title,e.code,a.assignment_type,t.id,coalesce(t.attempt_count,0),coalesce(t.status,'NOT_STARTED'),e.max_score,case when t.status in ('SUBMITTED','GRADED') then t.total_score end,round("+normalized+",3),t.submitted_at,t.duration_seconds,t.teacher_comment "+from+
                " order by a.created_at desc,a.id desc limit :limit offset :offset",parameters,
                (r,i)->new StudentClassExamResultsResponse.Item(r.getLong(1),r.getLong(2),r.getString(3),r.getString(4),ExamAssignmentType.valueOf(r.getString(5)),
                        r.getObject(6,Long.class),r.getInt(7),ExamAttemptStatus.valueOf(r.getString(8)),r.getBigDecimal(9),r.getBigDecimal(10),r.getBigDecimal(11),
                        "GRADED".equals(r.getString(8)),time(r.getObject(12,LocalDateTime.class)),r.getObject(13,Integer.class),r.getString(14)));
        return jdbc.queryForObject("select count(*),count(*) filter(where t.id is null or t.status='NOT_STARTED'),count(*) filter(where t.status='IN_PROGRESS'),count(*) filter(where t.status='SUBMITTED'),count(*) filter(where t.status='GRADED'),round(avg("+normalized+"),3),round(max("+normalized+"),3),round(min("+normalized+"),3) "+from,parameters,
                (r,i)->new StudentClassExamResultsResponse(classId,studentId,items,page,size,r.getLong(1),new StudentClassExamResultsResponse.Summary(
                        r.getLong(1),r.getLong(2),r.getLong(3),r.getLong(4)+r.getLong(5),r.getLong(4),r.getLong(5),r.getBigDecimal(6),r.getBigDecimal(7),r.getBigDecimal(8))));
    }
}
