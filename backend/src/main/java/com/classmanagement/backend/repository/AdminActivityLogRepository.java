package com.classmanagement.backend.repository;

import com.classmanagement.backend.entity.AdminActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AdminActivityLogRepository extends
        JpaRepository<AdminActivityLog, Long>,
        JpaSpecificationExecutor<AdminActivityLog> {
}
