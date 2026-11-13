package com.classmanagement.backend.service.billing;

import com.classmanagement.backend.dto.billing.BillingOrderResponse;
import com.classmanagement.backend.dto.billing.BillingOverviewResponse;
import com.classmanagement.backend.dto.billing.MomoIpnRequest;
import com.classmanagement.backend.dto.billing.RedeemVipRequest;
import com.classmanagement.backend.dto.billing.CreateBillingOrderRequest;
import com.classmanagement.backend.dto.billing.BillingInvoiceResponse;
import com.classmanagement.backend.entity.User;
import com.classmanagement.backend.entity.billing.BillingOrder;
import com.classmanagement.backend.entity.billing.TeacherPointLedgerEntry;
import com.classmanagement.backend.entity.billing.TeacherPointWallet;
import com.classmanagement.backend.entity.billing.TeacherVipSubscription;
import com.classmanagement.backend.entity.billing.TeacherMissionClaim;
import com.classmanagement.backend.entity.billing.BillingInvoice;
import com.classmanagement.backend.entity.billing.BillingInvoiceItem;
import com.classmanagement.backend.entity.billing.Mission;
import com.classmanagement.backend.entity.enums.MissionType;
import com.classmanagement.backend.entity.enums.ExamStatus;
import com.classmanagement.backend.entity.enums.MaterialType;
import com.classmanagement.backend.repository.classroom.ClassStudentRepository;
import com.classmanagement.backend.repository.classroom.ClassroomRepository;
import com.classmanagement.backend.repository.exam.ExamRepository;
import com.classmanagement.backend.repository.MaterialAssignmentRepository;
import com.classmanagement.backend.repository.MaterialRepository;
import com.classmanagement.backend.dto.billing.BillingMissionResponse;
import com.classmanagement.backend.dto.billing.MissionAdminResponse;
import com.classmanagement.backend.dto.billing.MissionRequest;
import com.classmanagement.backend.repository.billing.TeacherMissionClaimRepository;
import com.classmanagement.backend.repository.billing.MissionRepository;
import com.classmanagement.backend.entity.enums.UserRole;
import com.classmanagement.backend.entity.enums.UserStatus;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.billing.BillingOrderRepository;
import com.classmanagement.backend.repository.billing.BillingInvoiceRepository;
import com.classmanagement.backend.repository.billing.BillingInvoiceItemRepository;
import com.classmanagement.backend.repository.billing.TeacherPointLedgerRepository;
import com.classmanagement.backend.repository.billing.TeacherPointWalletRepository;
import com.classmanagement.backend.repository.billing.TeacherVipSubscriptionRepository;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BillingService {
    private final UserRepository users;
    private final BillingOrderRepository orders;
    private final BillingInvoiceRepository invoices;
    private final BillingInvoiceItemRepository invoiceItems;
    private final TeacherPointWalletRepository wallets;
    private final TeacherPointLedgerRepository ledger;
    private final TeacherVipSubscriptionRepository subscriptions;
    private final TeacherMissionClaimRepository missionClaims;
    private final MissionRepository missions;
    private final ClassroomRepository classrooms;
    private final ExamRepository exams;
    private final ClassStudentRepository classStudents;
    private final MaterialRepository materials;
    private final MaterialAssignmentRepository materialAssignments;
    private final JdbcTemplate jdbc;
    private final BillingProductCatalog catalog;
    private final MomoPaymentClient momo;
    private final TransactionTemplate transactions;

    public BillingService(
            UserRepository users,
            BillingOrderRepository orders,
            BillingInvoiceRepository invoices,
            BillingInvoiceItemRepository invoiceItems,
            TeacherPointWalletRepository wallets,
            TeacherPointLedgerRepository ledger,
            TeacherVipSubscriptionRepository subscriptions,
            TeacherMissionClaimRepository missionClaims,
            MissionRepository missions,
            ClassroomRepository classrooms,
            ExamRepository exams,
            ClassStudentRepository classStudents,
            MaterialRepository materials,
            MaterialAssignmentRepository materialAssignments,
            JdbcTemplate jdbc,
            BillingProductCatalog catalog,
            MomoPaymentClient momo,
            PlatformTransactionManager transactionManager) {
        this.users = users;
        this.orders = orders;
        this.invoices = invoices;
        this.invoiceItems = invoiceItems;
        this.wallets = wallets;
        this.ledger = ledger;
        this.subscriptions = subscriptions;
        this.missionClaims = missionClaims;
        this.missions = missions;
        this.classrooms = classrooms;
        this.exams = exams;
        this.classStudents = classStudents;
        this.materials = materials;
        this.materialAssignments = materialAssignments;
        this.jdbc = jdbc;
        this.catalog = catalog;
        this.momo = momo;
        this.transactions = new TransactionTemplate(transactionManager);
    }

    public List<BillingMissionResponse> missions(String username) {
        User teacher = requireTeacher(username);
        var claims = missionClaims.findByTeacherId(teacher.getId()).stream()
                .collect(Collectors.toMap(
                        item -> item.getMissionCode(),
                        Function.identity()));
        MissionProgress progress = loadMissionProgress(teacher);
        return missions.findAllByStatusOrderBySortOrderAscIdAsc("ACTIVE").stream()
                .map(mission -> {
                    var claim = claims.get(mission.getCode());
                    boolean eligible = claim == null
                            && isMissionEligible(mission.getMissionType(), mission.getTargetValue(), progress);
                    return new BillingMissionResponse(
                            mission.getCode(), mission.getName(), mission.getDescription(), mission.getRewardPoints(),
                            claim == null ? "AVAILABLE" : "CLAIMED",
                            claim == null ? null : claim.getClaimedAt(),
                            eligible);
                })
                .toList();
    }

    public BillingMissionResponse claimMission(String username, String missionCode) {
        User teacher = requireTeacher(username);
        var mission = missions.findByCode(missionCode)
                .filter(item -> "ACTIVE".equals(item.getStatus()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhiệm vụ"));

        return transactions.execute(status -> {
            TeacherPointWallet wallet = lockWallet(teacher.getId());
            if (missionClaims.findByTeacherIdAndMissionCode(teacher.getId(), mission.getCode()).isPresent()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Nhiệm vụ đã được nhận");
            }
            if (!isMissionEligible(mission.getMissionType(), mission.getTargetValue(),
                    loadMissionProgress(teacher))) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Nhiệm vụ chưa hoàn thành");
            }

            long balanceAfter = wallet.getPointsBalance() + mission.getRewardPoints();
            wallet.setPointsBalance(balanceAfter);
            wallet.setUpdatedAt(now());
            wallets.save(wallet);

            TeacherMissionClaim claim = new TeacherMissionClaim();
            claim.setTeacherId(teacher.getId());
            claim.setMissionCode(mission.getCode());
            claim.setRewardPoints(mission.getRewardPoints());
            missionClaims.saveAndFlush(claim);
            saveLedger(teacher.getId(), "mission:" + teacher.getId() + ":" + mission.getCode(), TeacherPointLedgerEntry.Type.CREDIT,
                    mission.getRewardPoints(), "MISSION_REWARD:" + mission.getCode(), null, balanceAfter);

            return new BillingMissionResponse(
                    mission.getCode(), mission.getName(), mission.getDescription(), mission.getRewardPoints(),
                    "CLAIMED", now(), false);
        });
    }

    private MissionProgress loadMissionProgress(User teacher) {
        return new MissionProgress(
                classrooms.countByTeacher_Id(teacher.getId()),
                classStudents.countDistinctStudentsByTeacherId(teacher.getId()),
                materials.countByTeacher_IdAndType(teacher.getId(), MaterialType.DOCUMENT),
                materialAssignments.countByMaterial_Teacher_IdAndMaterial_Type(
                        teacher.getId(), MaterialType.DOCUMENT),
                exams.countByTeacher_Username(teacher.getUsername()),
                exams.countByTeacher_UsernameAndStatus(teacher.getUsername(), ExamStatus.PUBLISHED),
                countHomeworkAssignments(teacher.getId()));
    }

    private boolean isMissionEligible(MissionType missionType, int targetValue, MissionProgress progress) {
        return switch (missionType) {
            case CLASS_CREATED, FIRST_CLASS -> progress.classes() >= targetValue;
            case STUDENT_ADDED_TO_CLASS, STUDENT_COUNT -> progress.students() >= targetValue;
            case DOCUMENT_CREATED -> progress.documents() >= targetValue;
            case DOCUMENT_ASSIGNED -> progress.assignedDocuments() >= targetValue;
            case EXAM_CREATED, FIRST_EXAM -> progress.exams() >= targetValue;
            case EXAM_PUBLISHED, FIRST_PUBLISHED_EXAM -> progress.publishedExams() >= targetValue;
            case HOMEWORK_CREATED, HOMEWORK_ASSIGNED -> progress.homeworks() >= targetValue;
            default -> false;
        };
    }

    private record MissionProgress(
            long classes,
            long students,
            long documents,
            long assignedDocuments,
            long exams,
            long publishedExams,
            long homeworks) {}

    private long countHomeworkAssignments(Long teacherId) {
        Long count = jdbc.queryForObject(
                "select count(*) from homework_assignments where teacher_id = ?",
                Long.class,
                teacherId);
        return count == null ? 0 : count;
    }

    public List<MissionAdminResponse> adminMissions() {
        return missions.findAllByOrderBySortOrderAscIdAsc().stream()
                .map(MissionAdminResponse::from)
                .toList();
    }

    public MissionAdminResponse createMission(MissionRequest request) {
        Mission mission = new Mission();
        mission.setCode(generateMissionCode(request.name()));
        applyMission(mission, request);
        return MissionAdminResponse.from(missions.save(mission));
    }

    public MissionAdminResponse updateMission(Long missionId, MissionRequest request) {
        Mission mission = missions.findById(missionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhiệm vụ"));
        applyMission(mission, request);
        return MissionAdminResponse.from(missions.save(mission));
    }

    public void deleteMission(Long missionId) {
        transactions.executeWithoutResult(status -> {
            Mission mission = missions.findById(missionId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Không tìm thấy nhiệm vụ"));
            missions.delete(mission);
        });
    }

    private void applyMission(Mission mission, MissionRequest request) {
        mission.setName(request.name().trim());
        mission.setDescription(request.description().trim());
        mission.setRewardPoints(request.rewardPoints());
        mission.setMissionType(request.missionType());
        mission.setTargetValue(request.targetValue());
        mission.setStatus(request.status().trim());
        mission.setSortOrder(request.sortOrder());
        mission.setUpdatedAt(now());
    }

    private String generateMissionCode(String name) {
        String base = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        if (base.isBlank()) {
            base = "mission";
        }
        base = base.substring(0, Math.min(base.length(), 50));

        String code = base;
        int suffix = 2;
        while (missions.existsByCode(code) || missionClaims.existsByMissionCode(code)) {
            code = base + "-" + suffix++;
        }
        return code;
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
            createInvoice(order, ipn.transId());
            return true;
        }));
    }

    public List<BillingInvoiceResponse> invoices(String username) {
        User teacher = requireTeacher(username);
        return invoices.findTop50ByTeacherIdOrderByIssuedAtDesc(teacher.getId()).stream()
                .map(invoice -> BillingInvoiceResponse.from(invoice,
                        invoiceItems.findByInvoiceIdOrderByLineNumberAsc(invoice.getId())))
                .toList();
    }

    public BillingInvoiceResponse invoice(String username, UUID invoiceId) {
        User teacher = requireTeacher(username);
        BillingInvoice invoice = invoices.findByIdAndTeacherId(invoiceId, teacher.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hóa đơn"));
        return BillingInvoiceResponse.from(invoice,
                invoiceItems.findByInvoiceIdOrderByLineNumberAsc(invoice.getId()));
    }

    private void createInvoice(BillingOrder order, String transactionId) {
        if (invoices.findByBillingOrderId(order.getId()).isPresent()) return;
        User teacher = users.findById(order.getTeacherId())
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy người mua của hóa đơn"));
        BillingProductCatalog.Product product = catalog.require(order.getProductCode());

        BillingInvoice invoice = new BillingInvoice();
        invoice.setId(UUID.randomUUID());
        invoice.setInvoiceNumber("INV-" + now().toLocalDate().toString().replace("-", "")
                + "-" + invoice.getId().toString().substring(0, 8).toUpperCase(Locale.ROOT));
        invoice.setTeacherId(order.getTeacherId());
        invoice.setBillingOrderId(order.getId());
        invoice.setStatus(BillingInvoice.Status.ISSUED);
        invoice.setCurrency("VND");
        invoice.setPaymentMethod("MOMO");
        invoice.setPaymentTransactionId(transactionId);
        invoice.setCustomerUsername(teacher.getUsername());
        invoice.setCustomerFullName(teacher.getFullName());
        invoice.setCustomerEmail(teacher.getEmail());
        invoice.setCustomerPhone(teacher.getPhone());
        invoice.setSubtotalVnd(order.getAmountVnd());
        invoice.setDiscountVnd(0);
        invoice.setTotalVnd(order.getAmountVnd());
        invoice.setPaidAt(order.getPaidAt());
        invoices.saveAndFlush(invoice);

        BillingInvoiceItem item = new BillingInvoiceItem();
        item.setInvoiceId(invoice.getId());
        item.setLineNumber(1);
        item.setProductCode(product.code());
        item.setProductName(product.name());
        item.setProductType(product.type().name());
        item.setQuantity(1);
        item.setUnitPriceVnd(product.amountVnd());
        item.setLineTotalVnd(product.amountVnd());
        item.setPointsGranted(product.pointsGranted());
        item.setPointsRequired(product.pointsRequired());
        item.setVipTier(product.vipTier() == null ? null : product.vipTier().name());
        item.setDeviceLimit(product.deviceLimit());
        item.setDurationMonths(product.durationMonths());
        invoiceItems.save(item);
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