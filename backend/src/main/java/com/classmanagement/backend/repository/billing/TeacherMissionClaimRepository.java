package com.classmanagement.backend.repository.billing;

import com.classmanagement.backend.entity.billing.TeacherMissionClaim;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeacherMissionClaimRepository extends JpaRepository<TeacherMissionClaim, Long> {
    List<TeacherMissionClaim> findByTeacherId(Long teacherId);
    Optional<TeacherMissionClaim> findByTeacherIdAndMissionCode(Long teacherId, String missionCode);
    List<TeacherMissionClaim> findByMissionCode(String missionCode);
    boolean existsByMissionCode(String missionCode);
}
