package com.classmanagement.backend.repository.request;

import com.classmanagement.backend.entity.Request;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface RequestRepository extends JpaRepository<Request, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Request r join fetch r.receiver join fetch r.sender where r.id = :requestId")
    Optional<Request> findByIdForUpdate(@org.springframework.data.repository.query.Param("requestId") Long requestId);
}
