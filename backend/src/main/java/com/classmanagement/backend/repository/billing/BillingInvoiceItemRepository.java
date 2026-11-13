package com.classmanagement.backend.repository.billing;

import com.classmanagement.backend.entity.billing.BillingInvoiceItem;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BillingInvoiceItemRepository extends JpaRepository<BillingInvoiceItem, Long> {
    List<BillingInvoiceItem> findByInvoiceIdOrderByLineNumberAsc(UUID invoiceId);
}
