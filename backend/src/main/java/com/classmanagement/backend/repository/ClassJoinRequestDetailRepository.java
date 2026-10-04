package com.classmanagement.backend.repository;

import com.classmanagement.backend.entity.ClassJoinRequestDetail;
import com.classmanagement.backend.entity.enums.RequestStatus;
import com.classmanagement.backend.entity.enums.RequestType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClassJoinRequestDetailRepository
                extends JpaRepository<ClassJoinRequestDetail, Long> {

        @EntityGraph(attributePaths = {
                        "request",
                        "request.sender",
                        "classroom"
        })
        List<ClassJoinRequestDetail> findAllByRequest_Receiver_UsernameAndRequest_TypeAndRequest_StatusOrderByRequest_CreatedAtDesc(
                        String username,
                        RequestType type,
                        RequestStatus status);

        @EntityGraph(attributePaths = {
                        "request",
                        "request.sender",
                        "request.receiver",
                        "classroom"
        })
        Optional<ClassJoinRequestDetail> findByRequest_Id(Long requestId);

        List<ClassJoinRequestDetail> findAllByClassroomId(Long classroomId);

}