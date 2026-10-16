package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.repository.exam.StudentExamReadRepository;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.*;
import java.sql.ResultSet;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class StudentGradesTest {
    private final List<String> queries=new ArrayList<>();
    private boolean noScores;
    private final NamedParameterJdbcTemplate jdbc=new NamedParameterJdbcTemplate(new JdbcTemplate()) {
        @Override public <T> List<T> query(String sql,SqlParameterSource p,RowMapper<T> mapper) { queries.add(sql); return List.of(); }
        @Override public <T> T queryForObject(String sql,SqlParameterSource p,RowMapper<T> mapper) {
            queries.add(sql);
            Object[] values=noScores?new Object[]{0L,null,null,null,0L,2L,3L,0L,0L,0L,0L,0L,null}:
                    new Object[]{6L,new BigDecimal("7.456"),new BigDecimal("9.50"),new BigDecimal("4.50"),12L,2L,1L,11L,1L,2L,4L,5L,null};
            ResultSet row=(ResultSet)Proxy.newProxyInstance(ResultSet.class.getClassLoader(),new Class<?>[]{ResultSet.class},(o,m,a)-> {
                Object value=values[(Integer)a[0]-1]; return m.getName().equals("getLong")?((Number)value).longValue():value;
            });
            try {return mapper.mapRow(row,0);}catch(java.sql.SQLException e){throw new AssertionError(e);}
        }
    };
    @Test void summaryUsesVisibleFinalScoresAndTableFilterDoesNotLimitCharts() {
        var p=new MapSqlParameterSource("studentId",21L);
        var result=new StudentExamReadRepository(jdbc).grades(p,"newest",0,6,true);
        assertEquals(new BigDecimal("7.456"),result.summary().average());
        assertEquals(new BigDecimal("91.67"),result.summary().passRate());
        assertEquals(1,result.summary().hiddenScoreCount()); assertEquals(6,result.totalElements());
        assertEquals(List.of(1L,2L,4L,5L),result.charts().scoreBands());
        assertEquals(4,queries.size());
        String aggregate=queries.getFirst(),timeline=queries.getLast();
        assertTrue(aggregate.contains("a.score_visibility='AFTER_SUBMIT'"));
        assertTrue(aggregate.contains("a.results_released_at"));
        assertTrue(aggregate.contains("t.status='GRADED' and e.max_score>0"));
        assertTrue(timeline.contains("limit 200")); assertFalse(timeline.contains("lower(title) like"));
    }
    @Test void noChartsSkipsTimelineAndNoVisibleGradesReturnsNullStatistics() {
        noScores=true;
        var result=new StudentExamReadRepository(jdbc).grades(new MapSqlParameterSource("studentId",21L),"score",0,6,false);
        assertNull(result.charts()); assertNull(result.summary().average()); assertNull(result.summary().passRate());
        assertTrue(result.summary().modes().isEmpty()); assertEquals(3,queries.size());
    }
}
