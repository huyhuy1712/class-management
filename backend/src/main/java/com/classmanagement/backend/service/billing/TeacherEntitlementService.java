package com.classmanagement.backend.service.billing;

import com.classmanagement.backend.repository.billing.TeacherVipSubscriptionRepository;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TeacherEntitlementService {
    public static final long FREE_CLASS_LIMIT = 5;
    public static final long FREE_EXAM_LIMIT = 5;
    public static final long FREE_HOMEWORK_LIMIT = 5;
    public static final long FREE_MATERIAL_LIMIT = 5;
    public static final long FREE_ATTENDANCE_LIMIT = 5;
    public static final int FREE_ATTEMPT_LIMIT = 10;

    private final TeacherVipSubscriptionRepository subscriptions;

    public TeacherEntitlementService(TeacherVipSubscriptionRepository subscriptions) {
        this.subscriptions = subscriptions;
    }

    public boolean hasVip(Long teacherId) {
        return subscriptions.existsByTeacherIdAndExpiresAtAfter(teacherId, now());
    }

    public void requireClassCapacity(Long teacherId, long currentClassCount) {
        if (!hasVip(teacherId) && currentClassCount >= FREE_CLASS_LIMIT) {
            throw upgradeRequired("Bạn đã đạt giới hạn 5 lớp của gói miễn phí. Hãy nâng cấp VIP để tiếp tục.");
        }
    }

    public void requireExamCapacity(Long teacherId, long currentExamCount) {
        if (!hasVip(teacherId) && currentExamCount >= FREE_EXAM_LIMIT) {
            throw upgradeRequired("Bạn đã đạt giới hạn 5 đề kiểm tra của gói miễn phí. Hãy nâng cấp VIP để tiếp tục.");
        }
    }

    public void requireHomeworkCapacity(Long teacherId, long currentCount) {
        if (!hasVip(teacherId) && currentCount >= FREE_HOMEWORK_LIMIT) {
            throw upgradeRequired("Bạn đã đạt giới hạn 5 bài tập của gói miễn phí. Hãy nâng cấp VIP để tiếp tục.");
        }
    }

    public void requireMaterialCapacity(Long teacherId, long currentCount) {
        requireMaterialCapacity(teacherId, currentCount, 1);
    }

    public void requireMaterialCapacity(Long teacherId, long currentCount, long additionalCount) {
        if (!hasVip(teacherId) && currentCount + additionalCount > FREE_MATERIAL_LIMIT) {
            throw upgradeRequired("Bạn đã đạt giới hạn 5 tài liệu của gói miễn phí. Hãy nâng cấp VIP để tiếp tục.");
        }
    }

    public void requireAttendanceCapacity(Long teacherId, long currentCount) {
        if (!hasVip(teacherId) && currentCount >= FREE_ATTENDANCE_LIMIT) {
            throw upgradeRequired("Bạn đã đạt giới hạn 5 phiên điểm danh của gói miễn phí. Hãy nâng cấp VIP để tiếp tục.");
        }
    }

    public void requireAttemptLimit(Long teacherId, int maxAttempts) {
        if (!hasVip(teacherId) && (maxAttempts == 0 || maxAttempts > FREE_ATTEMPT_LIMIT)) {
            throw upgradeRequired("Gói miễn phí chỉ cho phép tối đa 10 lượt làm bài. Hãy nâng cấp VIP để tiếp tục.");
        }
    }

    public void requireVipFeature(Long teacherId, String feature) {
        if (!hasVip(teacherId)) {
            throw upgradeRequired("Tính năng " + feature + " cần gói VIP.");
        }
    }

    private static ResponseStatusException upgradeRequired(String message) {
        return new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, message);
    }

    private static OffsetDateTime now() {
        return OffsetDateTime.now(ZoneOffset.UTC);
    }
}