package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.dto.exam.ClassGradebookResponse;
import com.classmanagement.backend.repository.exam.ExamAttemptDataRepository;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.*;
import java.sql.ResultSet;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class ClassGradebookTest {
    private final List<String> queries=new ArrayList<>();
    private boolean empty;
    private final NamedParameterJdbcTemplate jdbc=new NamedParameterJdbcTemplate(new JdbcTemplate()) {
        @Override public <T> T queryForObject(String sql,SqlParameterSource p,Class<T> type) { queries.add(sql); return type.cast(2L); }
        @Override public <T> List<T> query(String sql,SqlParameterSource p,RowMapper<T> mapper) {
            queries.add(sql);
            if(sql.startsWith("select u.id,u.student_code")) {
                assertTrue(sql.contains("order by lower(u.full_name),u.id limit :limit offset :offset"));
                assertFalse(sql.contains("grade_average"));
                assertEquals("%a!%!_!!%",p.getValue("pattern"));
                if(empty) return List.of();
                return List.of(map(mapper,new Object[]{21L,"ST-21","Student","mail","phone",null,null}));
            }
            if(sql.contains("select a.id,e.id,e.title")) return List.of(
                    map(mapper,new Object[]{12L,5L,"Exam","EX-5","ALL",new BigDecimal("20")}),
                    map(mapper,new Object[]{13L,6L,"Private","EX-6","STUDENT",BigDecimal.TEN}),
                    map(mapper,new Object[]{14L,7L,"Pending","EX-7","CLASS",BigDecimal.TEN}));
            assertEquals(List.of(21L),p.getValue("students"));
            return List.of(
                    map(mapper,new Object[]{21L,12L,true,10L,2,"GRADED",new BigDecimal("15"),new BigDecimal("7.5"),null}),
                    map(mapper,new Object[]{21L,13L,false,11L,1,"GRADED",BigDecimal.TEN,BigDecimal.TEN,null}),
                    map(mapper,new Object[]{21L,14L,true,15L,1,"SUBMITTED",null,null,null}));
        }
    };
    private static <T> T map(RowMapper<T> mapper,Object[] data) {
        ResultSet row=(ResultSet)Proxy.newProxyInstance(ResultSet.class.getClassLoader(),new Class<?>[]{ResultSet.class},(o,m,a)-> {
            Object v=data[(Integer)a[0]-1];
            return switch(m.getName()) {case "getLong"->((Number)v).longValue();case "getInt"->((Number)v).intValue();default->v;};
        });
        try{return mapper.mapRow(row,0);}catch(java.sql.SQLException e){throw new AssertionError(e);}
    }
    @Test void batchesMatrixAndAveragesOnlyAssignedFinalScores() {
        var result=new ExamAttemptDataRepository(jdbc).gradebook(new ClassGradebookResponse.ClassInfo(31L,"Class",1L,"Math"),11L,0,20,"a%_!",null);
        assertEquals(4,queries.size()); assertEquals(2,result.totalElements()); assertEquals(3,result.columns().size());
        var student=result.items().getFirst();
        assertEquals(new BigDecimal("7.500"),student.averageScoreOnTen()); assertEquals(1,student.gradedCount());
        assertFalse(student.cells().get(1).assigned()); assertNull(student.cells().get(1).attemptId()); assertNull(student.cells().get(1).scoreOnTen());
        assertNull(student.cells().get(2).scoreOnTen());
        assertTrue(queries.get(2).contains("s.class_id=c.id")); assertTrue(queries.get(2).contains("e.teacher_id=:teacherId"));
        assertTrue(queries.getLast().contains("u.id in (:students)"));
    }
    @Test void emptyStudentPageDoesNotReadAnyScores() {
        empty=true;
        var result=new ExamAttemptDataRepository(jdbc).gradebook(new ClassGradebookResponse.ClassInfo(31L,"Class",1L,"Math"),11L,10,20,"a%_!",null);
        assertTrue(result.items().isEmpty()); assertEquals(3,queries.size()); assertEquals(2,result.totalElements());
    }
}
