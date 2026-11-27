package com.classmanagement.backend.service.billing;

import com.classmanagement.backend.dto.billing.RedeemVipRequest;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.billing.TeacherPointWallet;
import com.classmanagement.backend.entity.billing.TeacherVipSubscription;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.billing.BillingInvoiceItemRepository;
import com.classmanagement.backend.repository.billing.BillingInvoiceRepository;
import com.classmanagement.backend.repository.billing.BillingOrderRepository;
import com.classmanagement.backend.repository.billing.MissionRepository;
import com.classmanagement.backend.repository.billing.TeacherMissionClaimRepository;
import com.classmanagement.backend.repository.billing.TeacherPointLedgerRepository;
import com.classmanagement.backend.repository.billing.TeacherPointWalletRepository;
import com.classmanagement.backend.repository.billing.TeacherVipSubscriptionRepository;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import com.classmanagement.backend.repository.classroom.ClassroomRepository;
import com.classmanagement.backend.repository.exam.ExamRepository;
import com.classmanagement.backend.repository.MaterialAssignmentRepository;
import com.classmanagement.backend.repository.MaterialRepository;
import com.classmanagement.backend.service.TeacherActivityService;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BillingServiceVipActivityTest {

    @Test
    void recordsRedeemedVipPackageInTeacherActivityHistory() {
        UserRepository users = mock(UserRepository.class);
        BillingOrderRepository orders = mock(BillingOrderRepository.class);
        BillingInvoiceRepository invoices = mock(BillingInvoiceRepository.class);
        BillingInvoiceItemRepository invoiceItems = mock(BillingInvoiceItemRepository.class);
        TeacherPointWalletRepository wallets = mock(TeacherPointWalletRepository.class);
        TeacherPointLedgerRepository ledger = mock(TeacherPointLedgerRepository.class);
        TeacherVipSubscriptionRepository subscriptions = mock(TeacherVipSubscriptionRepository.class);
        TeacherActivityService activityService = mock(TeacherActivityService.class);
        var vipSubscription = new TeacherVipSubscription();
        TeacherPointWallet wallet = new TeacherPointWallet(5L);
        wallet.setPointsBalance(50);

        when(users.findByUsername("teacher")).thenReturn(Optional.of(User.builder()
                .id(5L)
                .role(UserRole.TEACHER)
                .status(UserStatus.ACTIVE)
                .build()));
        when(ledger.findByEventKey(anyString())).thenReturn(Optional.empty());
        when(wallets.findLockedByTeacherId(5L)).thenReturn(Optional.of(wallet));
        when(wallets.findById(5L)).thenReturn(Optional.of(wallet));
        when(subscriptions.findActiveByTeacher(eq(5L), any())).thenReturn(List.of());
        when(subscriptions.findLockedByTeacherAndTier(5L, "PERSONAL"))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(vipSubscription));
        when(ledger.findTop20ByTeacherIdOrderByCreatedAtDescIdDesc(5L)).thenReturn(List.of());

        BillingService service = new BillingService(
                users,
                orders,
                invoices,
                invoiceItems,
                wallets,
                ledger,
                subscriptions,
                mock(TeacherMissionClaimRepository.class),
                mock(MissionRepository.class),
                mock(ClassroomRepository.class),
                mock(ExamRepository.class),
                mock(ClassStudentRepository.class),
                mock(MaterialRepository.class),
                mock(MaterialAssignmentRepository.class),
                mock(JdbcTemplate.class),
                new BillingProductCatalog(),
                mock(VnpayPaymentClient.class),
                activityService,
                mock(PlatformTransactionManager.class));

        service.redeemVip("teacher", new RedeemVipRequest("vip-personal-1m", UUID.randomUUID()));

        verify(activityService).record(
                eq(5L),
                eq("REDEEM"),
                eq("VIP"),
                isNull(),
                isNull(),
                contains("VIP Cá nhân · 1 thiết bị · 1 tháng · đổi 20 Point"));
    }
}
