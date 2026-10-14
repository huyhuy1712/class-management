package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.repository.exam.ExamAttemptDataRepository;
import com.classmanagement.backend.entity.enums.ExamAttemptStatus;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.*;
import java.lang.reflect.Proxy;
import java.sql.ResultSet;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class ExamSubmissionListTest {
    private final List<String> sql=new ArrayList<>();
    private SqlParameterSource parameters;
    private boolean empty;
    private boolean notStarted;
    private boolean classAccess;
    private BigDecimal average=new BigDecimal("5.25");
    private BigDecimal[] modes={new BigDecimal("4.50"),new BigDecimal("6.00")};
    private final NamedParameterJdbcTemplate jdbc=new NamedParameterJdbcTemplate(new JdbcTemplate()) {
        @Override public <T> T queryForObject(String query,SqlParameterSource p,Class<T> type) {
            sql.add(query); parameters=p;
            return type.cast(classAccess);
        }
        @Override public <T> List<T> query(String query,SqlParameterSource p,RowMapper<T> mapper) {
            sql.add(query); parameters=p;
            if(empty) return List.of();
            if(notStarted) return List.of(map(mapper,new Object[]{null,2L,"Student",0,"NOT_STARTED",0,null,null,"ST-2","s@example.com",null,null,null,null,null}));
            return List.of(map(mapper,new Object[]{1L,2L,"Student",2,"SUBMITTED",3,new BigDecimal("4.50"),"avatar.png","ST-2","s@example.com",
                    LocalDateTime.of(2026,10,14,10,0),LocalDateTime.of(2026,10,14,10,30),1800,"Comment",7L}));
        }
        @Override public <T> T queryForObject(String query,SqlParameterSource p,RowMapper<T> mapper) {
            sql.add(query);
            java.sql.Array array=modes==null?null:(java.sql.Array)Proxy.newProxyInstance(java.sql.Array.class.getClassLoader(),new Class<?>[]{java.sql.Array.class},
                    (o,m,a)->m.getName().equals("getArray")?modes:null);
            return map(mapper,new Object[]{empty?0L:1L,8L,1L,2L,3L,2L,average,array});
        }
    };
    private static <T> T map(RowMapper<T> mapper,Object[] values) {
        ResultSet row=(ResultSet)Proxy.newProxyInstance(ResultSet.class.getClassLoader(),new Class<?>[]{ResultSet.class},(o,m,a)-> {
            Object value=values[(Integer)a[0]-1];
            return switch(m.getName()) {
                case "getLong"->((Number)value).longValue();
                case "getInt"->((Number)value).intValue();
                case "getString"->value==null?null:value.toString();
                default->value;
            };
        });
        try { return mapper.mapRow(row,0); } catch(java.sql.SQLException ex) { throw new AssertionError(ex); }
    }
    @Test void returnsCardFieldsAndGlobalCountersWithTwoQueries() {
        var page=new ExamAttemptDataRepository(jdbc).list(12L,0,20,ExamAttemptStatus.SUBMITTED,"A%_!","score_desc",null);
        assertEquals(2,sql.size()); assertTrue(sql.getFirst().contains("order by t.total_score desc nulls last,u.id desc"));
        assertEquals("%a!%!_!!%",parameters.getValue("pattern"));
        assertEquals("ST-2",page.items().getFirst().studentCode());
        assertEquals("Comment",page.items().getFirst().teacherComment());
        assertEquals(1800,page.items().getFirst().durationSeconds());
        assertEquals(7L,page.items().getFirst().revision());
        assertFalse(page.items().getFirst().isFinal());
        assertEquals("+07:00",page.items().getFirst().submittedAt().getOffset().toString());
        assertEquals(1,page.totalElements()); assertEquals(8,page.stats().total());
        assertEquals(5,page.stats().submitted()); assertEquals(3,page.stats().pendingGrading()); assertEquals(2,page.stats().graded());
        assertEquals(new BigDecimal("5.25"),page.stats().averageScore());
        assertEquals(List.of(new BigDecimal("4.50"),new BigDecimal("6.00")),page.stats().modes());
        assertTrue(sql.getLast().contains("where status='GRADED' and total_score is not null"));
        assertTrue(sql.getLast().contains("frequency>1"));
    }
    @Test void absentFinalScoresAndModeAreNotInventedAsZero() {
        average=null; modes=null;
        var page=new ExamAttemptDataRepository(jdbc).list(12L,0,20,null,"","newest",21L);
        assertNull(page.stats().averageScore()); assertTrue(page.stats().modes().isEmpty());
        assertEquals(2,sql.size());
    }
    @Test void emptyFilteredPageStillReturnsGlobalStatsAndStableSorts() {
        empty=true;
        for(String sort:List.of("newest","oldest","name","score_asc")) {
            var page=new ExamAttemptDataRepository(jdbc).list(12L,5,20,null,"none",sort,null);
            assertTrue(page.items().isEmpty()); assertEquals(0,page.totalElements()); assertEquals(8,page.stats().total());
            assertEquals(100L,parameters.getValue("offset"));
        }
        assertEquals(8,sql.size());
    }
    @Test void notStartedRecipientHasNullAttemptAndClassScopeAppliesToBothQueries() {
        notStarted=true;
        var page=new ExamAttemptDataRepository(jdbc).list(12L,0,20,ExamAttemptStatus.NOT_STARTED,"","name",21L);
        var student=page.items().getFirst();
        assertNull(student.attemptId()); assertNull(student.revision()); assertNull(student.totalScore());
        assertNull(student.startedAt()); assertNull(student.submittedAt()); assertNull(student.durationSeconds());
        assertEquals(0,student.attemptNumber()); assertEquals(ExamAttemptStatus.NOT_STARTED,student.status());
        assertEquals(21L,parameters.getValue("classId")); assertEquals(2,sql.size());
        for(String statement:sql) {
            assertTrue(statement.contains("left join exam_attempts"));
            assertTrue(statement.contains("s.class_id=:classId"));
            assertTrue(statement.contains("cs.class_id=:classId"));
            assertTrue(statement.contains("coalesce(t.status,'NOT_STARTED')=:status"));
        }
    }
    @Test void classAuthorizationRequiresOwnerAndCorrectTargetForEveryAssignmentType() {
        var repository=new ExamAttemptDataRepository(jdbc);
        assertFalse(repository.classAllowed(12L,99L));
        classAccess=true; assertTrue(repository.classAllowed(12L,21L));
        assertEquals(21L,parameters.getValue("classId"));
        assertTrue(sql.getFirst().contains("c.teacher_id=e.teacher_id"));
        assertTrue(sql.getFirst().contains("a.assignment_type='ALL' and c.status='ACTIVE'"));
        assertTrue(sql.getFirst().contains("exam_assignment_classes"));
        assertTrue(sql.getFirst().contains("exam_assignment_students"));
    }
}
