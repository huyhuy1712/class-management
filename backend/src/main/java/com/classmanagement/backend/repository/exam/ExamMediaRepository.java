package com.classmanagement.backend.repository.exam;

import com.classmanagement.backend.entity.ExamMedia;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.*;

public interface ExamMediaRepository extends JpaRepository<ExamMedia, UUID> {
    List<ExamMedia> findAllByExam_IdAndStatus(Long examId,
            com.classmanagement.backend.entity.enums.ExamMediaStatus status);

    @Modifying(flushAutomatically = true)
    @Query("""
        update ExamMedia m
        set m.status = com.classmanagement.backend.entity.enums.ExamMediaStatus.DELETE_PENDING,
            m.exam = null, m.nextCleanupAt = :now
        where m.exam.id = :examId
        """)
    int queueCleanupByExamId(@Param("examId") Long examId, @Param("now") LocalDateTime now);

    @Modifying(flushAutomatically = true)
    @Query("""
        update ExamMedia m
        set m.status = com.classmanagement.backend.entity.enums.ExamMediaStatus.DELETE_PENDING,
            m.exam = null, m.nextCleanupAt = :now
        where m.exam.id = :examId and m.id in :ids
        """)
    int queueUnusedByExamId(@Param("examId") Long examId, @Param("ids") Collection<UUID> ids,
            @Param("now") LocalDateTime now);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from ExamMedia m where m.id = :id")
    Optional<ExamMedia> findLockedById(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from ExamMedia m where m.id in :ids order by m.id")
    List<ExamMedia> findAllLockedByIds(@Param("ids") Collection<UUID> ids);

    @Query("""
        select m.id from ExamMedia m
        where m.nextCleanupAt <= :now
          and (m.status in (com.classmanagement.backend.entity.enums.ExamMediaStatus.UPLOADING,
                            com.classmanagement.backend.entity.enums.ExamMediaStatus.TEMP,
                            com.classmanagement.backend.entity.enums.ExamMediaStatus.DELETE_PENDING)
               or (m.status = com.classmanagement.backend.entity.enums.ExamMediaStatus.ATTACHED
                   and m.exam is null))
        order by m.nextCleanupAt, m.id
        """)
    List<UUID> findCleanupCandidates(@Param("now") LocalDateTime now, Pageable pageable);
}
