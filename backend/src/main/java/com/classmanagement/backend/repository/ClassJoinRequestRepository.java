package com.classmanagement.backend.repository;

import com.classmanagement.backend.entity.ClassJoinRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClassJoinRequestRepository
        extends JpaRepository<ClassJoinRequest, Long> {

    Optional<ClassJoinRequest> findByClassroom_IdAndStudent_Id(
            Long classroomId,
            Long studentId);
}