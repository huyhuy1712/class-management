package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.repository.exam.ExamAttemptDataRepository;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StudentClassExamResultsTest {

    private final List<String> sql = new ArrayList<>();
    private boolean empty;

    private final NamedParameterJdbcTemplate jdbc = new NamedParameterJdbcTemplate(new JdbcTemplate()) {
        @Override
        public <T> List<T> query(String query, SqlParameterSource parameters, RowMapper<T> mapper) {
            sql.add(query);
            assertEquals(31L, parameters.getValue("classId"));
            assertEquals(21L, parameters.getValue("studentId"));

            if (empty) {
                return List.of();
            }

            return List.of(map(mapper, new Object[] {
                    12L,
                    5L,
                    "Exam",
                    "EX-5",
                    "STUDENT",
                    null,
                    0,
                    "NOT_STARTED",
                    new BigDecimal("20"),
                    null,
                    null,
                    null,
                    null,
                    null
            }));
        }

        @Override
        public <T> T queryForObject(String query, SqlParameterSource parameters, RowMapper<T> mapper) {
            sql.add(query);
            Object[] values = empty
                    ? new Object[] {0L, 0L, 0L, 0L, 0L, null, null, null}
                    : new Object[] {
                            8L,
                            2L,
                            1L,
                            2L,
                            3L,
                            new BigDecimal("7.50"),
                            new BigDecimal("9.00"),
                            new BigDecimal("6.00")
                    };

            return map(mapper, values);
        }
    };

    private static <T> T map(RowMapper<T> mapper, Object[] values) {
        ResultSet row = (ResultSet) Proxy.newProxyInstance(
                ResultSet.class.getClassLoader(),
                new Class<?>[] {ResultSet.class},
                (proxy, method, arguments) -> {
                    Object value = values[(Integer) arguments[0] - 1];
                    return switch (method.getName()) {
                        case "getLong" -> ((Number) value).longValue();
                        case "getInt" -> ((Number) value).intValue();
                        default -> value;
                    };
                });

        try {
            return mapper.mapRow(row, 0);
        } catch (java.sql.SQLException exception) {
            throw new AssertionError(exception);
        }
    }

    @Test
    void combinesPagedItemsAndGlobalNormalizedStatsWithoutChildQueries() {
        var result = new ExamAttemptDataRepository(jdbc).studentClassResults(31L, 21L, 11L, 0, 10);

        assertEquals(2, sql.size());
        assertEquals(8, result.totalElements());
        assertEquals(1, result.items().size());
        assertNull(result.items().getFirst().attemptId());
        assertNull(result.items().getFirst().totalScore());
        assertEquals(5, result.summary().submitted());
        assertEquals(2, result.summary().pendingGrading());
        assertEquals(new BigDecimal("7.50"), result.summary().averageScoreOnTen());

        for (String statement : sql) {
            String normalizedSql = statement.replaceAll("\\s+", " ").replaceAll("\\s*=\\s*", "=");

            assertTrue(normalizedSql.contains("s.class_id=:classId"));
            assertTrue(normalizedSql.contains("ac.class_id=:classId"));
            assertTrue(normalizedSql.contains("a.assignment_type='ALL'"));
            assertTrue(normalizedSql.contains("e.teacher_id=:teacherId"));
            assertTrue(normalizedSql.contains("left join exam_attempts"));
            assertTrue(normalizedSql.contains("t.status='GRADED' and e.max_score>0"));
        }
    }

    @Test
    void emptyOverviewHasNullScoresInsteadOfMisleadingZeros() {
        empty = true;
        var result = new ExamAttemptDataRepository(jdbc).studentClassResults(31L, 21L, 11L, 10, 10);

        assertTrue(result.items().isEmpty());
        assertEquals(0, result.totalElements());
        assertNull(result.summary().averageScoreOnTen());
        assertNull(result.summary().highestScoreOnTen());
        assertNull(result.summary().lowestScoreOnTen());
    }
}
