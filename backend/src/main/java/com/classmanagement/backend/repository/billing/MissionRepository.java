package com.classmanagement.backend.repository.billing;

import com.classmanagement.backend.entity.billing.Mission;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MissionRepository extends JpaRepository<Mission, Long> {
    List<Mission> findAllByOrderBySortOrderAscIdAsc();
    List<Mission> findAllByStatusNotOrderBySortOrderAscIdAsc(String status);
    List<Mission> findAllByStatusOrderBySortOrderAscIdAsc(String status);
    Optional<Mission> findByCode(String code);
    boolean existsByCode(String code);
}
