package com.classmanagement.backend.repository.billing;

import com.classmanagement.backend.entity.billing.BillingInvoice;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BillingInvoiceRepository extends JpaRepository<BillingInvoice, UUID> {
    Optional<BillingInvoice> findByBillingOrderId(UUID billingOrderId);
    List<BillingInvoice> findTop50ByTeacherIdOrderByIssuedAtDesc(Long teacherId);
    Optional<BillingInvoice> findByIdAndTeacherId(UUID id, Long teacherId);
}
