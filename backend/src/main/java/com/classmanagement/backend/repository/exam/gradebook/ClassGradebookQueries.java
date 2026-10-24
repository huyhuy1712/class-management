package com.classmanagement.backend.repository.exam.gradebook;

import com.classmanagement.backend.dto.exam.ClassGradebookResponse;
import com.classmanagement.backend.dto.exam.StudentClassExamResultsResponse;
import com.classmanagement.backend.entity.enums.ExamAssignmentType;
import com.classmanagement.backend.entity.enums.ExamAttemptStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

/** Class gradebook and individual student results, queried in batches. */
@RequiredArgsConstructor
public class ClassGradebookQueries {

    private final NamedParameterJdbcTemplate jdbc;

    public boolean studentClassAllowed(Long classId, Long studentId, Long teacherId) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
                """
                        select exists(
                            select 1
                            from classes c
                            join class_students cs on cs.class_id = c.id
                            join users u on u.id = cs.student_id
                            where c.id = :classId
                              and c.teacher_id = :teacherId
                              and cs.student_id = :studentId
                              and u.role = 'STUDENT'
                        )
                        """,
                p("classId", classId, "studentId", studentId, "teacherId", teacherId),
                Boolean.class));
    }

    public Optional<ClassGradebookResponse.ClassInfo> gradebookClass(Long classId, Long teacherId) {
        return jdbc.query(
                """
                        select c.id, c.name, c.subject_id, s.name
                        from classes c
                        left join subjects s on s.id = c.subject_id
                        where c.id = :classId
                          and c.teacher_id = :teacherId
                        """,
                p("classId", classId, "teacherId", teacherId),
                (r, i) -> new ClassGradebookResponse.ClassInfo(
                        r.getLong(1),
                        r.getString(2),
                        r.getObject(3, Long.class),
                        r.getString(4)))
                .stream().findFirst();
    }

    public ClassGradebookResponse gradebook(ClassGradebookResponse.ClassInfo classroom, Long teacherId, int page,
            int size, String q, Long subjectId) {
        Long classId = classroom.id();
        var parameters = p(
                "classId", classId,
                "teacherId", teacherId,
                "subjectId", subjectId,
                "q", q,
                "pattern", "%" + q.replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%",
                "limit", size,
                "offset", (long) page * size);
        String roster = """
                from class_students cs
                join users u on u.id = cs.student_id
                where cs.class_id = :classId
                  and u.role = 'STUDENT'
                  and (
                    :q = ''
                    or lower(u.full_name) like :pattern escape '!'
                    or lower(u.email) like :pattern escape '!'
                    or lower(u.student_code) like :pattern escape '!'
                    or lower(u.username) like :pattern escape '!'
                    or u.phone like :pattern escape '!'
                    or cast(u.id as varchar) = :q
                  )
                """;
        long count = jdbc.queryForObject("select count(*) " + roster, parameters, Long.class);
        var students = jdbc.query(
                """
                        select u.id, u.student_code, u.full_name, u.email, u.phone, u.avatar, cs.joined_at
                        """ + roster + """
                        order by lower(u.full_name), u.id
                        limit :limit offset :offset
                        """,
                parameters,
                (r, i) -> new ClassGradebookResponse.Student(
                        r.getLong(1),
                        r.getString(2),
                        r.getString(3),
                        r.getString(4),
                        r.getString(5),
                        r.getString(6),
                        time(r.getObject(7, LocalDateTime.class)),
                        null,
                        0,
                        List.of()));
        var columns = jdbc.query(
                """
                        select a.id, e.id, e.title, e.code, a.assignment_type, e.max_score
                        from exam_assignments a
                        join exams e on e.id = a.exam_id
                        join classes c on c.id = :classId
                        where e.teacher_id = :teacherId
                          and c.teacher_id = :teacherId
                          and e.status <> 'DRAFT'
                          and a.status <> 'DRAFT'
                          and (cast(:subjectId as bigint) is null or e.subject_id = :subjectId)
                          and (
                            (
                              a.assignment_type in ('ALL', 'CLASS')
                              and (
                                a.assignment_type = 'ALL'
                                or exists (
                                  select 1
                                  from exam_assignment_classes ac
                                  where ac.assignment_id = a.id
                                    and ac.class_id = c.id
                                )
                              )
                              and (
                                c.status = 'ACTIVE'
                                or exists (
                                  select 1
                                  from exam_attempts t
                                  join class_students cs on cs.student_id = t.student_id
                                  where t.assignment_id = a.id
                                    and cs.class_id = c.id
                                )
                              )
                            )
                            or (
                              a.assignment_type = 'STUDENT'
                              and exists (
                                select 1
                                from exam_assignment_students s
                                join class_students cs on cs.student_id = s.student_id
                                where s.assignment_id = a.id
                                  and s.class_id = c.id
                                  and cs.class_id = c.id
                              )
                            )
                          )
                        order by a.created_at, a.id
                        """,
                parameters,
                (r, i) -> new ClassGradebookResponse.Column(
                        r.getLong(1),
                        r.getLong(2),
                        r.getString(3),
                        r.getString(4),
                        ExamAssignmentType.valueOf(r.getString(5)),
                        r.getBigDecimal(6)));
        if (students.isEmpty() || columns.isEmpty()) {
            return new ClassGradebookResponse(classroom, columns, students, page, size, count);
        }
        parameters
                .addValue("students", students.stream().map(ClassGradebookResponse.Student::studentId).toList())
                .addValue("assignments", columns.stream().map(ClassGradebookResponse.Column::assignmentId).toList());
        var cells = jdbc
                .query("""
                        select
                            u.id,
                            a.id,
                            case
                                when a.assignment_type = 'STUDENT' then exists (
                                    select 1
                                    from exam_assignment_students s
                                    where s.assignment_id = a.id
                                      and s.student_id = u.id
                                      and s.class_id = :classId
                                )
                                else (c.status = 'ACTIVE' or t.id is not null)
                            end assigned,
                            t.id,
                            coalesce(t.attempt_count, 0),
                            coalesce(t.status, 'NOT_STARTED'),
                            case when t.status = 'GRADED' then t.total_score end,
                            case
                                when t.status = 'GRADED' and e.max_score > 0
                                then t.total_score * 10.0 / e.max_score
                            end,
                            t.submitted_at
                        from users u
                        cross join exam_assignments a
                        join exams e on e.id = a.exam_id
                        join classes c on c.id = :classId
                        left join exam_attempts t on t.assignment_id = a.id and t.student_id = u.id
                        where u.id in (:students)
                          and a.id in (:assignments)
                        """,
                        parameters,
                        (r, i) -> Map.entry(
                                r.getLong(1),
                                new ClassGradebookResponse.Cell(
                                        r.getLong(2),
                                        r.getBoolean(3),
                                        r.getObject(4, Long.class),
                                        r.getInt(5),
                                        ExamAttemptStatus.valueOf(r.getString(6)),
                                        r.getBigDecimal(7),
                                        r.getBigDecimal(8),
                                        time(r.getObject(9, LocalDateTime.class)))));
        var byStudent = new HashMap<Long, List<ClassGradebookResponse.Cell>>();
        var sums = new HashMap<Long, BigDecimal>();
        var counts = new HashMap<Long, Long>();
        for (var entry : cells) {
            var cell = entry.getValue();
            if (cell.assigned() && cell.scoreOnTen() != null) {
                sums.merge(entry.getKey(), cell.scoreOnTen(), BigDecimal::add);
                counts.merge(entry.getKey(), 1L, Long::sum);
            }
            if (!cell.assigned()) {
                cell = new ClassGradebookResponse.Cell(cell.assignmentId(), false, null, 0, null, null, null, null);
            } else if (cell.scoreOnTen() != null) {
                cell = new ClassGradebookResponse.Cell(cell.assignmentId(), true, cell.attemptId(),
                        cell.attemptNumber(), cell.status(), cell.totalScore(),
                        cell.scoreOnTen().setScale(3, java.math.RoundingMode.HALF_UP), cell.submittedAt());
            }
            byStudent.computeIfAbsent(entry.getKey(), id -> new ArrayList<>()).add(cell);
        }
        var order = new HashMap<Long, Integer>();
        for (int i = 0; i < columns.size(); i++) {
            order.put(columns.get(i).assignmentId(), i);
        }
        var rows = students.stream().map(student -> {
            long graded = counts.getOrDefault(student.studentId(), 0L);
            BigDecimal average = graded == 0 ? null
                    : sums.get(student.studentId()).divide(BigDecimal.valueOf(graded), 3,
                            java.math.RoundingMode.HALF_UP);
            var values = byStudent.getOrDefault(student.studentId(), new ArrayList<>());
            values.sort(Comparator.comparing(c -> order.get(c.assignmentId())));
            return new ClassGradebookResponse.Student(
                    student.studentId(),
                    student.studentCode(),
                    student.fullName(),
                    student.email(),
                    student.phone(),
                    student.avatarUrl(),
                    student.joinedAt(),
                    average,
                    graded,
                    values);
        }).toList();
        return new ClassGradebookResponse(classroom, columns, rows, page, size, count);
    }

    public StudentClassExamResultsResponse studentClassResults(
            Long classId, Long studentId, Long teacherId, int page, int size) {
        var parameters = p(
                "classId", classId,
                "studentId", studentId,
                "teacherId", teacherId,
                "limit", size,
                "offset", (long) page * size);
        String from = """
                from exam_assignments a
                join exams e on e.id = a.exam_id
                join classes c on c.id = :classId and c.teacher_id = e.teacher_id
                left join exam_attempts t on t.assignment_id = a.id and t.student_id = :studentId
                where e.teacher_id = :teacherId
                  and e.status <> 'DRAFT'
                  and a.status <> 'DRAFT'
                  and (
                    (a.assignment_type = 'CLASS' and (c.status = 'ACTIVE' or t.id is not null) and exists (
                        select 1
                        from exam_assignment_classes ac
                        where ac.assignment_id = a.id
                          and ac.class_id = :classId
                    ))
                    or (a.assignment_type = 'ALL' and (c.status = 'ACTIVE' or t.id is not null))
                    or (a.assignment_type = 'STUDENT' and exists (
                        select 1
                        from exam_assignment_students s
                        where s.assignment_id = a.id
                          and s.student_id = :studentId
                          and s.class_id = :classId
                    ))
                )
                """;
        String normalized = "case when t.status='GRADED' and e.max_score>0 then t.total_score*10.0/e.max_score end";
        var items = jdbc.query(
                """
                        select a.id, e.id, e.title, e.code, a.assignment_type, t.id,
                               coalesce(t.attempt_count, 0), coalesce(t.status, 'NOT_STARTED'), e.max_score,
                               case when t.status in ('SUBMITTED', 'GRADED') then t.total_score end,
                               round(
                        """ + normalized + """
                        , 3), t.submitted_at, t.duration_seconds, t.teacher_comment
                        """ + from + """
                        order by a.created_at desc, a.id desc
                        limit :limit offset :offset
                        """,
                parameters,
                (r, i) -> new StudentClassExamResultsResponse.Item(
                        r.getLong(1),
                        r.getLong(2),
                        r.getString(3),
                        r.getString(4),
                        ExamAssignmentType.valueOf(r.getString(5)),
                        r.getObject(6, Long.class),
                        r.getInt(7),
                        ExamAttemptStatus.valueOf(r.getString(8)),
                        r.getBigDecimal(9),
                        r.getBigDecimal(10),
                        r.getBigDecimal(11),
                        "GRADED".equals(r.getString(8)),
                        time(r.getObject(12, LocalDateTime.class)),
                        r.getObject(13, Integer.class),
                        r.getString(14)));
        return jdbc.queryForObject(
                """
                        select
                            count(*),
                            count(*) filter (where t.id is null or t.status = 'NOT_STARTED'),
                            count(*) filter (where t.status = 'IN_PROGRESS'),
                            count(*) filter (where t.status = 'SUBMITTED'),
                            count(*) filter (where t.status = 'GRADED'),
                            round(avg(
                        """ + normalized + """
                        ), 3),
                            round(max(
                        """ + normalized + """
                        ), 3),
                            round(min(
                        """ + normalized + """
                        ), 3)
                        """ + from,
                parameters,
                (r, i) -> new StudentClassExamResultsResponse(
                        classId,
                        studentId,
                        items,
                        page,
                        size,
                        r.getLong(1),
                        new StudentClassExamResultsResponse.Summary(
                                r.getLong(1),
                                r.getLong(2),
                                r.getLong(3),
                                r.getLong(4) + r.getLong(5),
                                r.getLong(4),
                                r.getLong(5),
                                r.getBigDecimal(6),
                                r.getBigDecimal(7),
                                r.getBigDecimal(8))));
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
