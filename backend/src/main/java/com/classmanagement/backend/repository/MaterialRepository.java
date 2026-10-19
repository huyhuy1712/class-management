package com.classmanagement.backend.repository;

import com.classmanagement.backend.entity.Material;
import com.classmanagement.backend.entity.enums.MaterialType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaterialRepository extends JpaRepository<Material, Long> {
    List<Material> findAllByClassroom_IdAndTypeOrderByCreatedAtDesc(Long classroomId, MaterialType type);
}
