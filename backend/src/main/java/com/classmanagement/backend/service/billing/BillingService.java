package com.classmanagement.backend.service.billing;

import com.classmanagement.backend.dto.billing.BillingOrderResponse;
import com.classmanagement.backend.dto.billing.BillingOverviewResponse;
import com.classmanagement.backend.dto.billing.MomoIpnRequest;
import com.classmanagement.backend.dto.billing.RedeemVipRequest;
import com.classmanagement.backend.dto.billing.CreateBillingOrderRequest;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.billing.BillingOrder;
import com.classmanagement.backend.entity.billing.TeacherPointLedgerEntry;
import com.classmanagement.backend.entity.billing.TeacherPointWallet;
import com.classmanagement.backend.entity.billing.TeacherVipSubscription;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.billing.BillingOrderRepository;
import com.classmanagement.backend.repository.billing.TeacherPointLedgerRepository;
import com.classmanagement.backend.repository.billing.TeacherPointWalletRepository;
import com.classmanagement.backend.repository.billing.TeacherVipSubscriptionRepository;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BillingService {
    private final UserRepository users;
    private final BillingOrderRepository orders;
    private final TeacherPointWalletRepository wallets;
    private final TeacherPointLedgerRepository ledger;
    private final TeacherVipSubscriptionRepository subscriptions;
    private final BillingProductCatalog catalog;
    private final MomoPaymentClient momo;
    private final TransactionTemplate transactions;

    public BillingService(
            UserRepository users,
            BillingOrderRepository orders,
            TeacherPointWalletRepository wallets,
            TeacherPointLedgerRepository ledger,
            TeacherVipSubscriptionRepository subscriptions,
            BillingProductCatalog catalog,
            MomoPaymentClient momo,
            PlatformTransactionManager transactionManager) {
        this.users = users;
        this.orders = orders;
        this.wallets = wallets;
        this.ledger = ledger;
        this.subscriptions = subscriptions;
        this.catalog = catalog;
        this.momo = momo;
        this.transactions = new TransactionTemplate(transactionManager);
    }

    public BillingOverviewResponse overview(String username) {
        User teacher = requireTeacher(username);
        OffsetDateTime now = now();
        TeacherPointWallet wallet = wallets.findById(teacher.getId()).orElse(null);
        List<TeacherVipSubscription> active = subscriptions.findActiveByTeacher(teacher.getId(), now);
        var vip = active.isEmpty() ? null : active.getFirst();
        return new BillingOverviewResponse(
                wallet == null ? 0 : wallet.getPointsBalance(),
            momo.isAvailable(),
                vip == null ? null : vip.getVipTier(),
                vip == null ? 0 : vip.getDeviceLimit(),
                vip == null ? null : vip.getExpiresAt(),
                catalog.products(),
                active.stream()
                        .map(item -> new BillingOverviewResponse.Subscription(
                                item.getVipTier(), item.getDeviceLimit(), item.getExpiresAt()))
                        .toList(),
                ledger.findTop20ByTeacherIdOrderByCreatedAtDescIdDesc(teacher.getId()).stream()
                        .map(item -> new BillingOverviewResponse.LedgerEntry(
                                item.getEntryType().name(), item.getPoints(), item.getReason(),
                                item.getBalanceAfter(), item.getCreatedAt()))
                        .toList());
    }

    public BillingOrderResponse createOrder(String username, CreateBillingOrderRequest request) {
        User teacher = requireTeacher(username);
        BillingProductCatalog.Product product = catalog.require(request.productCode());
        BillingOrder prior = orders.findByTeacherIdAndRequestId(teacher.getId(), request.requestId())
            .orElse(null);
        if (prior == null) momo.requireAvailable();
        BillingOrder order = createOrReuseOrder(teacher.getId(), request, product);
        if (order.getStatus() != BillingOrder.Status.PENDING || order.getPayUrl() != null) {
            return BillingOrderResponse.from(order);
        }

        boolean claimed = Boolean.TRUE.equals(transactions.execute(status -> {
            BillingOrder locked = orders.findLockedById(order.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            if (locked.getStatus() != BillingOrder.Status.PENDING || locked.getPayUrl() != null) return false;
            locked.setStatus(BillingOrder.Status.CREATING);
            orders.saveAndFlush(locked);
            return true;
        }));
        if (!claimed) return orderStatus(username, order.getId());

        try {
            String payUrl = momo.createPayUrl(order);
            BillingOrder updated = transactions.execute(status -> {
                BillingOrder locked = orders.findLockedById(order.getId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
                if (locked.getStatus() == BillingOrder.Status.CREATING) {
                    locked.setPayUrl(payUrl);
                    locked.setStatus(BillingOrder.Status.PENDING);
                    return orders.saveAndFlush(locked);
                }
                return locked;
            });
            return BillingOrderResponse.from(updated == null ? order : updated);
        } catch (MomoPaymentRejectedException exception) {
            transactions.executeWithoutResult(status -> orders.findLockedById(order.getId()).ifPresent(locked -> {
                if (locked.getStatus() == BillingOrder.Status.CREATING) {
                    locked.setStatus(BillingOrder.Status.FAILED);
                    orders.save(locked);
                }
            }));
            throw exception;
        }
    }

    public BillingOrderResponse orderStatus(String username, UUID orderId) {
        User teacher = requireTeacher(username);
        BillingOrder order = transactions.execute(status -> {
            BillingOrder locked = orders.findLockedById(orderId)
                    .filter(item -> item.getTeacherId().equals(teacher.getId()))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
                if ((locked.getStatus() == BillingOrder.Status.CREATING
                        || locked.getStatus() == BillingOrder.Status.PENDING)
                    && locked.getExpiresAt().isBefore(now())) {
                locked.setStatus(BillingOrder.Status.EXPIRED);
                orders.save(locked);
            }
            return locked;
        });
        if (order == null) throw new IllegalStateException("Không thể đọc trạng thái order");
        return BillingOrderResponse.from(order);
    }

    public BillingOverviewResponse redeemVip(String username, RedeemVipRequest request) {
        User teacher = requireTeacher(username);
        BillingProductCatalog.Product product = catalog.require(request.productCode());
        if (product.type() != BillingProductCatalog.Type.VIP) {
            throw new IllegalArgumentException("Chỉ có thể đổi gói VIP bằng point");
        }

        transactions.executeWithoutResult(status -> {
            String eventKey = "redeem:" + teacher.getId() + ":" + request.requestId();
            var existing = ledger.findByEventKey(eventKey).orElse(null);
            String reason = "VIP_REDEEM:" + product.code();
            if (existing != null) {
                if (!existing.getReason().equals(reason) || !existing.getTeacherId().equals(teacher.getId())) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Yêu cầu đổi point đã được dùng");
                }
                return;
            }

            wallets.createIfMissing(teacher.getId());
            TeacherPointWallet wallet = wallets.findLockedByTeacherId(teacher.getId())
                    .orElseThrow(() -> new IllegalStateException("Không thể khởi tạo ví point"));
                if (ledger.findByEventKey(eventKey).isPresent()) return;
            if (wallet.getPointsBalance() < product.pointsRequired()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Số dư point không đủ");
            }

            wallet.setPointsBalance(wallet.getPointsBalance() - product.pointsRequired());
            wallet.setUpdatedAt(now());
            wallets.save(wallet);
            saveLedger(teacher.getId(), eventKey, TeacherPointLedgerEntry.Type.DEBIT,
                    product.pointsRequired(), reason, null, wallet.getPointsBalance());
            extendVip(teacher.getId(), product, null);
        });
        return overview(username);
    }

    public boolean acceptIpn(MomoIpnRequest ipn) {
        if (!momo.isValidIpn(ipn)) return false;
        UUID orderId;
        try {
            orderId = UUID.fromString(ipn.orderId());
        } catch (RuntimeException exception) {
            return false;
        }

        return Boolean.TRUE.equals(transactions.execute(status -> {
            BillingOrder order = orders.findLockedById(orderId).orElse(null);
            if (order == null
                    || !order.getRequestId().toString().equals(ipn.requestId())
                    || order.getAmountVnd() != ipn.amount()) return false;
            if (order.getStatus() == BillingOrder.Status.PAID) return true;
                if (order.getStatus() == BillingOrder.Status.EXPIRED && ipn.resultCode() != 0) return true;
                if (order.getStatus() != BillingOrder.Status.PENDING
                    && order.getStatus() != BillingOrder.Status.CREATING
                    && order.getStatus() != BillingOrder.Status.EXPIRED) return false;
            if (ipn.resultCode() != 0) {
                order.setStatus(BillingOrder.Status.FAILED);
                orders.save(order);
                return true;
            }
            if (ipn.transId() == null || ipn.transId().isBlank()) return false;

            lockWallet(order.getTeacherId());
            order.setStatus(BillingOrder.Status.PAID);
            order.setMomoTransactionId(ipn.transId());
            order.setPaidAt(now());
            orders.save(order);
            if (order.getProductType() == BillingOrder.ProductType.POINTS) {
                creditPoints(order);
            } else {
                extendVip(order.getTeacherId(), catalog.require(order.getProductCode()), order.getId());
            }
            return true;
        }));
    }

    private BillingOrder createOrReuseOrder(
            Long teacherId, CreateBillingOrderRequest request, BillingProductCatalog.Product product) {
        BillingOrder existing = orders.findByTeacherIdAndRequestId(teacherId, request.requestId()).orElse(null);
        if (existing != null) return requireSameProduct(existing, product);

        BillingOrder order = new BillingOrder();
        order.setId(UUID.randomUUID());
        order.setTeacherId(teacherId);
        order.setRequestId(request.requestId());
        order.setProductCode(product.code());
        order.setProductType(product.type() == BillingProductCatalog.Type.POINTS
                ? BillingOrder.ProductType.POINTS : BillingOrder.ProductType.VIP);
        order.setAmountVnd(product.amountVnd());
        order.setPointsGranted(product.pointsGranted());
        order.setPointsRequired(product.pointsRequired());
        order.setVipTier(product.vipTier() == null ? null : product.vipTier().name());
        order.setDeviceLimit(product.deviceLimit());
        order.setDurationMonths(product.durationMonths());
        order.setStatus(BillingOrder.Status.PENDING);
        order.setExpiresAt(now().plusMinutes(20));
        try {
            return transactions.execute(status -> orders.saveAndFlush(order));
        } catch (DataIntegrityViolationException exception) {
            BillingOrder concurrent = orders.findByTeacherIdAndRequestId(teacherId, request.requestId())
                    .orElseThrow(() -> exception);
            return requireSameProduct(concurrent, product);
        }
    }

    private BillingOrder requireSameProduct(BillingOrder order, BillingProductCatalog.Product product) {
        if (!order.getProductCode().equals(product.code())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request ID đã dùng cho gói khác");
        }
        return order;
    }

    private void creditPoints(BillingOrder order) {
        TeacherPointWallet wallet = lockWallet(order.getTeacherId());
        wallet.setPointsBalance(wallet.getPointsBalance() + order.getPointsGranted());
        wallet.setUpdatedAt(now());
        wallets.save(wallet);
        saveLedger(order.getTeacherId(), "payment:" + order.getId(),
                TeacherPointLedgerEntry.Type.CREDIT, order.getPointsGranted(), "POINT_PURCHASE",
                order.getId(), wallet.getPointsBalance());
    }

    private void extendVip(Long teacherId, BillingProductCatalog.Product product, UUID orderId) {
        OffsetDateTime currentTime = now();
        OffsetDateTime baseExpiry = subscriptions
                .findLockedByTeacherAndTier(teacherId, product.vipTier().name())
                .map(TeacherVipSubscription::getExpiresAt)
                .filter(expiry -> expiry.isAfter(currentTime))
                .orElse(currentTime);
        OffsetDateTime expiry = baseExpiry.plusMonths(product.durationMonths());
        subscriptions.createIfMissing(teacherId, product.vipTier().name(), product.deviceLimit(), currentTime);
        TeacherVipSubscription subscription = subscriptions
                .findLockedByTeacherAndTier(teacherId, product.vipTier().name())
                .orElseThrow(() -> new IllegalStateException("Không thể tạo quyền VIP"));
        subscription.setDeviceLimit(product.deviceLimit());
        subscription.setExpiresAt(expiry);
        subscription.setLastOrderId(orderId);
        subscription.setUpdatedAt(currentTime);
        subscriptions.save(subscription);
    }

    private void saveLedger(
            Long teacherId,
            String eventKey,
            TeacherPointLedgerEntry.Type type,
            long points,
            String reason,
            UUID orderId,
            long balanceAfter) {
        TeacherPointLedgerEntry entry = new TeacherPointLedgerEntry();
        entry.setTeacherId(teacherId);
        entry.setEventKey(eventKey);
        entry.setEntryType(type);
        entry.setPoints(points);
        entry.setReason(reason);
        entry.setOrderId(orderId);
        entry.setBalanceAfter(balanceAfter);
        ledger.save(entry);
    }

    private TeacherPointWallet lockWallet(Long teacherId) {
        wallets.createIfMissing(teacherId);
        return wallets.findLockedByTeacherId(teacherId)
                .orElseThrow(() -> new IllegalStateException("Không thể khởi tạo ví point"));
    }

    private User requireTeacher(String username) {
        User user = users.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (user.getRole() != UserRole.TEACHER || user.getStatus() != UserStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ giáo viên đang hoạt động được dùng thanh toán");
        }
        return user;
    }

    private static OffsetDateTime now() {
        return OffsetDateTime.now(ZoneOffset.UTC);
    }
}