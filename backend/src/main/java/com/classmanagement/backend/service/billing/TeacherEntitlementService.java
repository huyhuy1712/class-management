package com.classmanagement.backend.service.billing;

import com.classmanagement.backend.repository.billing.TeacherVipSubscriptionRepository;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TeacherEntitlementService {
    public static final long FREE_CLASS_LIMIT = 1;
    public static final long FREE_EXAM_LIMIT = 3;
    public static final int FREE_ATTEMPT_LIMIT = 2;

    private final TeacherVipSubscriptionRepository subscriptions;

    public TeacherEntitlementService(TeacherVipSubscriptionRepository subscriptions) {
        this.subscriptions = subscriptions;
    }

    public boolean hasVip(Long teacherId) {
        return subscriptions.existsByTeacherIdAndExpiresAtAfter(teacherId, now());
    }

    public void requireClassCapacity(Long teacherId, long currentClassCount) {
        if (!hasVip(teacherId) && currentClassCount >= FREE_CLASS_LIMIT) {
            throw upgradeRequired("Gói miễn phí chỉ tạo được 1 lớp. Hãy nâng VIP để tạo thêm lớp.");
        }
    }

    public void requireExamCapacity(Long teacherId, long currentExamCount) {
        if (!hasVip(teacherId) && currentExamCount >= FREE_EXAM_LIMIT) {
            throw upgradeRequired("Gói miễn phí chỉ tạo được 3 đề. Hãy nâng VIP để tạo thêm đề.");
        }
    }

    public void requireAttemptLimit(Long teacherId, int maxAttempts) {
        if (!hasVip(teacherId) && (maxAttempts == 0 || maxAttempts > FREE_ATTEMPT_LIMIT)) {
            throw upgradeRequired("Gói miễn phí giới hạn 2 lượt thi cho mỗi học sinh.");
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