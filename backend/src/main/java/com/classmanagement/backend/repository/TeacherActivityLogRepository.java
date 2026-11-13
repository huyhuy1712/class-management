package com.classmanagement.backend.repository;

import com.classmanagement.backend.entity.TeacherActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface TeacherActivityLogRepository extends JpaRepository<TeacherActivityLog, Long>,
        JpaSpecificationExecutor<TeacherActivityLog> {

    long countByActorId(Long actorId);

    long countByActorIdAndOccurredAtGreaterThanEqual(Long actorId, LocalDateTime fromTime);

    long countByOccurredAtGreaterThanEqual(LocalDateTime fromTime);

    @Query("select count(distinct log.resourceType) from TeacherActivityLog log where log.actorId = :actorId")
    long countResourceTypesByActorId(@Param("actorId") Long actorId);

    @Query("select count(distinct log.resourceType) from TeacherActivityLog log")
    long countDistinctResourceTypes();
}
