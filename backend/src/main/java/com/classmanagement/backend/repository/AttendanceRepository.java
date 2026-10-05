package com.classmanagement.backend.repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.classmanagement.backend.entity.Attendance;
import com.classmanagement.backend.entity.enums.AttendanceStatus;

public interface AttendanceRepository
        extends JpaRepository<Attendance, Long> {

long countByStudent_Id(Long studentId);

long countByStudent_IdAndStatusIn(
        Long studentId,
        Collection<AttendanceStatus> statuses);

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

@EntityGraph(attributePaths = "classroom")
List<Attendance> findAllByStudent_IdOrderByDateDesc(Long studentId);

long deleteByClassroom_IdAndStudent_IdAndDate(
                Long classroomId,
                Long studentId,
                LocalDate date);
}