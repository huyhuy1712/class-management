package com.classmanagement.backend.repository;

import com.classmanagement.backend.entity.Material;
import com.classmanagement.backend.entity.enums.MaterialType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Collection;
import java.util.Optional;

public interface MaterialRepository extends JpaRepository<Material, Long> {
    List<Material> findAllByTeacher_IdAndTypeOrderByCreatedAtDesc(Long teacherId, MaterialType type);

    Optional<Material> findByIdAndTeacher_Id(Long id, Long teacherId);

    List<Material> findAllByIdInAndTypeOrderByCreatedAtDesc(Collection<Long> ids, MaterialType type);
}
