package com.classmanagement.backend.repository.request;

import com.classmanagement.backend.entity.Request;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequestRepository extends JpaRepository<Request, Long> {
}