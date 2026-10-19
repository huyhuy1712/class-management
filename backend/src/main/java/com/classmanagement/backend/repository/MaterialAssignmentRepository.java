package com.classmanagement.backend.repository;

import com.classmanagement.backend.entity.MaterialAssignment;
import com.classmanagement.backend.entity.enums.MaterialAssignmentType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MaterialAssignmentRepository extends JpaRepository<MaterialAssignment, Long> {

    @EntityGraph(attributePaths = "material")
    @Query("select assignment from MaterialAssignment assignment "
            + "where assignment.material.teacher.id = :teacherId "
            + "and assignment.material.type = com.classmanagement.backend.entity.enums.MaterialType.DOCUMENT "
            + "order by assignment.material.createdAt desc")
    List<MaterialAssignment> findDocumentsByTeacherId(@Param("teacherId") Long teacherId);

    @EntityGraph(attributePaths = "material")
    List<MaterialAssignment> findAllByIdIn(Collection<Long> ids);

    @EntityGraph(attributePaths = "material")
    List<MaterialAssignment> findAllByMaterial_IdIn(Collection<Long> materialIds);

    Optional<MaterialAssignment> findByMaterial_Id(Long materialId);

    long countByIdIn(Collection<Long> ids);

    List<MaterialAssignment> findAllByAssignmentTypeAndMaterial_Teacher_Id(
            MaterialAssignmentType assignmentType, Long teacherId);
}
