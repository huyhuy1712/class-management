package com.classmanagement.backend.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.classmanagement.backend.entity.Attendance;

public interface AttendanceRepository
        extends JpaRepository<Attendance, Long> {

boolean existsByClassroom_IdAndStudent_IdAndDate(
        Long classroomId,
        Long studentId,
        LocalDate date);

@EntityGraph(attributePaths = {
        "student"
})
List<Attendance> findAllByClassroom_IdOrderByDateDesc(
        Long classroomId
);

long deleteByClassroom_IdAndStudent_IdAndDate(
                Long classroomId,
                Long studentId,
                LocalDate date);

boolean existsByClassroom_IdAndStudent_IdAndDateAndIdNot(
                Long classroomId,
                Long studentId,
                LocalDate date,
                Long attendanceId);
}