package com.classmanagement.backend.repository;

import java.time.LocalDate;

import org.springframework.data.jpa.repository.JpaRepository;

import com.classmanagement.backend.entity.Attendance;

public interface AttendanceRepository
        extends JpaRepository<Attendance, Long> {

    boolean existsByClassroom_IdAndStudent_IdAndDate(
            Long classroomId,
            Long studentId,
            LocalDate date);
}