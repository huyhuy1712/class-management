package com.classmanagement.backend.repository.billing;

import com.classmanagement.backend.entity.billing.BillingOrder;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BillingOrderRepository extends JpaRepository<BillingOrder, UUID> {
    Optional<BillingOrder> findByTeacherIdAndRequestId(Long teacherId, UUID requestId);
    Optional<BillingOrder> findByIdAndTeacherId(UUID id, Long teacherId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select billingOrder from BillingOrder billingOrder where billingOrder.id = :orderId")
    Optional<BillingOrder> findLockedById(@Param("orderId") UUID orderId);
}